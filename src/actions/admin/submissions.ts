"use server";

import { formatLessonSlug } from "@/features/submissions/utils";
import { dispatchLoggedNotificationEmail } from "@/lib/notifications/events";
import { revalidateDashboardPaths } from "@/lib/server/revalidation";
import { revalidatePath } from "next/cache";
import { getValidatedAdminContext } from "./shared";
import {
  getFormString,
  hasLengthInRange,
  isUuid,
  normalizeMultiline,
  normalizeWhitespace,
  parseBoundedInteger,
} from "@/lib/validation";
import type { SubmissionUpdate } from "@/features/submissions/types";
import type { Language } from "@/types/i18n";

export async function submitFeedback(formData: FormData) {
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

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("exercise_id, lesson_slug, rating, submitted_language, user_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    console.error("Error loading submission review notification context:", {
      submissionId,
      submissionError,
    });
    return;
  }

  const { data: studentProfile, error: studentProfileError } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", submission.user_id)
    .maybeSingle();

  if (studentProfileError || !studentProfile?.email) {
    console.error(
      "Error loading student notification recipient for reviewed submission:",
      {
        submissionId,
        studentProfileError,
        userId: submission.user_id,
      },
    );
    return;
  }

  const submissionLanguage: Language =
    submission.submitted_language === "nl" ? "nl" : "en";
  const lessonLabel = formatLessonSlug(submission.lesson_slug);
  const greetingLine = studentProfile.full_name?.trim()
    ? submissionLanguage === "nl"
      ? `Hallo ${studentProfile.full_name.trim()},`
      : `Hello ${studentProfile.full_name.trim()},`
    : submissionLanguage === "nl"
      ? "Hallo,"
      : "Hello,";
  const reviewSummary =
    submissionLanguage === "nl"
      ? [
          greetingLine,
          "",
          `Je oefening voor ${lessonLabel} is nagekeken.`,
          `Score: ${submission.rating ?? rating}/5`,
          ...(submission.exercise_id
            ? [`Oefening: ${submission.exercise_id}`]
            : []),
          "",
          "Feedback:",
          feedback,
          "",
          "Je kan de volledige feedback ook in je dashboard bekijken.",
        ].join("\n")
      : [
          greetingLine,
          "",
          `Your exercise submission for ${lessonLabel} has been reviewed.`,
          `Rating: ${submission.rating ?? rating}/5`,
          ...(submission.exercise_id
            ? [`Exercise: ${submission.exercise_id}`]
            : []),
          "",
          "Feedback:",
          feedback,
          "",
          "You can also review the full feedback in your dashboard.",
        ].join("\n");

  const notificationResult = await dispatchLoggedNotificationEmail({
    aggregateId: submissionId,
    aggregateType: "submission",
    eventType: "submission_reviewed",
    payload: {
      exercise_id: submission.exercise_id,
      lesson_slug: submission.lesson_slug,
      rating: submission.rating ?? rating,
      reviewed_by: user.id,
      user_id: submission.user_id,
    },
    to: studentProfile.email,
    subject:
      submissionLanguage === "nl"
        ? `Feedback beschikbaar voor ${lessonLabel}`
        : `Your feedback is ready for ${lessonLabel}`,
    text: reviewSummary,
  });

  if (!notificationResult.success) {
    console.error(
      "Failed to send reviewed submission notification to student",
      {
        error: notificationResult.error,
        submissionId,
        userId: submission.user_id,
      },
    );
  }
}
