"use server";

import { revalidatePath } from "next/cache";

import type { SubmissionUpdate } from "@/features/submissions/types";
import { formatLessonSlug } from "@/features/submissions/utils";
import { queueLoggedNotificationEmail } from "@/lib/notifications/events";
import { revalidateDashboardPaths } from "@/lib/server/revalidation";
import {
  getFormString,
  hasLengthInRange,
  isUuid,
  normalizeMultiline,
  normalizeWhitespace,
  parseBoundedInteger,
} from "@/lib/validation";
import type { Language } from "@/types/i18n";

import { getValidatedAdminContext } from "./shared";

type AdminSupabaseClient = NonNullable<
  Awaited<ReturnType<typeof getValidatedAdminContext>>
>["supabase"];

type SubmissionReviewNotificationContext = {
  payload: {
    exercise_id: string | null;
    lesson_slug: string;
    rating: number;
    reviewed_by: string;
    user_id: string;
  };
  studentEmail: string;
  subject: string;
  text: string;
  userId: string;
};

/**
 * Builds the localized student email sent after an exercise submission has
 * been reviewed, including the final rating and reviewer feedback.
 */
function buildSubmissionReviewNotification(options: {
  exerciseId: string | null;
  feedback: string;
  fullName: string | null;
  language: Language;
  lessonLabel: string;
  rating: number;
}) {
  const greetingName = options.fullName?.trim();
  let greetingLine = options.language === "nl" ? "Hallo," : "Hello,";

  if (greetingName) {
    greetingLine =
      options.language === "nl"
        ? `Hallo ${greetingName},`
        : `Hello ${greetingName},`;
  }

  const exerciseLine = options.exerciseId
    ? [
        options.language === "nl"
          ? `Oefening: ${options.exerciseId}`
          : `Exercise: ${options.exerciseId}`,
      ]
    : [];
  const text =
    options.language === "nl"
      ? [
          greetingLine,
          "",
          `Je oefening voor ${options.lessonLabel} is nagekeken.`,
          `Score: ${options.rating}/5`,
          ...exerciseLine,
          "",
          "Feedback:",
          options.feedback,
          "",
          "Je kan de volledige feedback ook in je dashboard bekijken.",
        ].join("\n")
      : [
          greetingLine,
          "",
          `Your exercise submission for ${options.lessonLabel} has been reviewed.`,
          `Rating: ${options.rating}/5`,
          ...exerciseLine,
          "",
          "Feedback:",
          options.feedback,
          "",
          "You can also review the full feedback in your dashboard.",
        ].join("\n");

  return {
    subject:
      options.language === "nl"
        ? `Je Coptic Compass-feedback is beschikbaar voor ${options.lessonLabel}`
        : `Your Coptic Compass feedback is ready for ${options.lessonLabel}`,
    text,
  };
}

/**
 * Loads the submission and student profile data needed to notify the student
 * after review. Missing data short-circuits notification without blocking the
 * persisted review outcome.
 */
async function loadSubmissionReviewNotificationContext(options: {
  feedback: string;
  rating: number;
  reviewerId: string;
  submissionId: string;
  supabase: AdminSupabaseClient;
}): Promise<SubmissionReviewNotificationContext | null> {
  const { data: submission, error: submissionError } = await options.supabase
    .from("submissions")
    .select("exercise_id, lesson_slug, rating, submitted_language, user_id")
    .eq("id", options.submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    console.error("Error loading submission review notification context:", {
      submissionId: options.submissionId,
      submissionError,
    });
    return null;
  }

  const { data: studentProfile, error: studentProfileError } =
    await options.supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", submission.user_id)
      .maybeSingle();

  if (studentProfileError || !studentProfile?.email) {
    console.error(
      "Error loading student notification recipient for reviewed submission:",
      {
        submissionId: options.submissionId,
        studentProfileError,
        userId: submission.user_id,
      },
    );
    return null;
  }

  const language: Language =
    submission.submitted_language === "nl" ? "nl" : "en";
  const lessonLabel = formatLessonSlug(submission.lesson_slug);
  const resolvedRating = submission.rating ?? options.rating;
  const reviewNotification = buildSubmissionReviewNotification({
    exerciseId: submission.exercise_id,
    feedback: options.feedback,
    fullName: studentProfile.full_name,
    language,
    lessonLabel,
    rating: resolvedRating,
  });

  return {
    payload: {
      exercise_id: submission.exercise_id,
      lesson_slug: submission.lesson_slug,
      rating: resolvedRating,
      reviewed_by: options.reviewerId,
      user_id: submission.user_id,
    },
    studentEmail: studentProfile.email,
    subject: reviewNotification.subject,
    text: reviewNotification.text,
    userId: submission.user_id,
  };
}

/**
 * Persists an admin review on a submission, updates dashboard/admin views, and
 * then sends a best-effort review notification to the student.
 */
export async function submitFeedback(formData: FormData): Promise<void> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    console.warn(
      "Admin feedback submission skipped because Supabase is not configured.",
    );
    return;
  }

  const { supabase, user } = adminContext;

  const submissionId = normalizeWhitespace(
    getFormString(formData, "submission_id"),
  );
  const rating = parseBoundedInteger(
    normalizeWhitespace(getFormString(formData, "rating")),
    {
      min: 1,
      max: 5,
    },
  );
  const feedback = normalizeMultiline(getFormString(formData, "feedback"));

  if (
    !isUuid(submissionId) ||
    rating === null ||
    !hasLengthInRange(feedback, { min: 1, max: 5000 })
  ) {
    console.warn("Rejected invalid admin feedback submission", {
      userId: user.id,
      submissionId,
      rating,
      feedbackLength: feedback.length,
    });
    return;
  }

  const updates: SubmissionUpdate = {
    status: "reviewed",
    rating,
    feedback_text: feedback,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  };

  const { error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", submissionId);

  if (error) {
    console.error("Error submitting feedback:", error);
    return;
  }

  revalidatePath("/admin");
  revalidateDashboardPaths();
  const notificationContext = await loadSubmissionReviewNotificationContext({
    feedback,
    rating,
    reviewerId: user.id,
    submissionId,
    supabase,
  });

  if (!notificationContext) {
    return;
  }

  const notificationResult = await queueLoggedNotificationEmail({
    aggregateId: submissionId,
    aggregateType: "submission",
    eventType: "submission_reviewed",
    payload: notificationContext.payload,
    to: notificationContext.studentEmail,
    subject: notificationContext.subject,
    text: notificationContext.text,
  });

  if (!notificationResult.success) {
    console.error(
      "Failed to send reviewed submission notification to student",
      {
        error: notificationResult.error,
        submissionId,
        userId: notificationContext.userId,
      },
    );
  }
}

/**
 * Soft-deletes a submission for admin workflows while keeping the record in
 * storage for audit history and related dashboard reporting.
 */
export async function deleteSubmission(formData: FormData): Promise<void> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    console.warn(
      "Admin submission deletion skipped because Supabase is not configured.",
    );
    return;
  }

  const { supabase, user } = adminContext;

  const submissionId = normalizeWhitespace(
    getFormString(formData, "submission_id"),
  );
  const lessonSlug = normalizeWhitespace(
    getFormString(formData, "lesson_slug"),
  );
  const deletionReason = normalizeWhitespace(
    getFormString(formData, "deletion_reason"),
  );

  if (
    !isUuid(submissionId) ||
    !hasLengthInRange(deletionReason, { min: 3, max: 120 })
  ) {
    console.warn("Rejected invalid admin submission deletion payload", {
      userId: user.id,
      submissionId,
      deletionReason,
    });
    return;
  }

  const updates: SubmissionUpdate = {
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
    deletion_reason: deletionReason,
  };

  const { error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", submissionId);

  if (error) {
    console.error("Error soft deleting submission:", error);
    return;
  }

  revalidatePath("/admin");
  if (lessonSlug.length > 0) {
    revalidatePath(`/grammar/${lessonSlug}`);
  }
  revalidateDashboardPaths();
}
