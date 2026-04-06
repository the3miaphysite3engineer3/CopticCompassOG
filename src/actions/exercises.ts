"use server";

import {
  getGrammarExerciseDocumentById,
  getGrammarLessonDocumentBySlug,
} from "@/content/grammar/registry";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import {
  consumeRateLimit,
  getUserRateLimitIdentifier,
  hasAvailableRateLimitProtection,
} from "@/lib/rateLimit";
import { dispatchLoggedOwnerAlertEmail } from "@/lib/notifications/events";
import { revalidatePath } from "next/cache";
import {
  getFormString,
  hasLengthInRange,
  normalizeMultiline,
  normalizeWhitespace,
} from "@/lib/validation";
import { revalidateDashboardPaths } from "@/lib/server/revalidation";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import type { SubmissionInsert } from "@/features/submissions/types";
import { formatLessonSlug } from "@/features/submissions/utils";
import type { Language } from "@/types/i18n";

export type ExerciseActionState = {
  success?: boolean;
  error?: string;
} | null;

const SUBMISSION_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

function isExerciseLanguage(value: string): value is Language {
  return value === "en" || value === "nl";
}

export async function submitExercise(
  _prevState: ExerciseActionState,
  formData: FormData,
): Promise<ExerciseActionState> {
  if (!hasSupabaseRuntimeEnv()) {
    return {
      success: false,
      error: "Exercise submission is temporarily unavailable.",
    };
  }

  const authContext = await getAuthenticatedServerContext();
  if (!authContext)
    return { success: false, error: "Unauthorized. Please log in first." };
  const { supabase, user } = authContext;

  const lessonSlug = normalizeWhitespace(getFormString(formData, "lessonSlug"));
  const exerciseId = normalizeWhitespace(getFormString(formData, "exerciseId"));
  const exerciseLanguage = normalizeWhitespace(
    getFormString(formData, "exerciseLanguage"),
  );
  const submissionIntentId = normalizeWhitespace(
    getFormString(formData, "submissionIntentId"),
  );
  const lessonDefinition = getGrammarLessonDocumentBySlug(lessonSlug);
  const exerciseDefinition = getGrammarExerciseDocumentById(exerciseId);

  if (
    !lessonDefinition ||
    !exerciseDefinition ||
    exerciseDefinition.lessonId !== lessonDefinition.id ||
    !isExerciseLanguage(exerciseLanguage) ||
    !hasLengthInRange(submissionIntentId, { min: 16, max: 200 })
  ) {
    return { success: false, error: "Invalid exercise submission." };
  }

  const expectedAnswerKeys = new Set(
    exerciseDefinition.items.map((question) => `answer_${question.id}`),
  );
  const providedAnswerKeys = new Set(
    Array.from(formData.keys()).filter((key) => key.startsWith("answer_")),
  );

  if (
    providedAnswerKeys.size !== expectedAnswerKeys.size ||
    Array.from(providedAnswerKeys).some((key) => !expectedAnswerKeys.has(key))
  ) {
    return {
      success: false,
      error: "Exercise answers were incomplete or malformed.",
    };
  }

  const answers = exerciseDefinition.items.map((question) => {
    const answer = normalizeMultiline(
      getFormString(formData, `answer_${question.id}`),
    );
    return {
      answerSchema: question.answerSchema,
      prompt: question.prompt[exerciseLanguage],
      questionId: question.id,
      answer,
    };
  });

  if (
    answers.some(
      ({ answer, answerSchema }) =>
        !hasLengthInRange(answer, {
          min: answerSchema?.minLength ?? 1,
          max: answerSchema?.maxLength ?? 500,
        }),
    )
  ) {
    return {
      success: false,
      error: "Each answer must be between 1 and 500 characters.",
    };
  }

  const submittedText = answers
    .map(({ prompt, answer }) => `Question: ${prompt}\nAnswer: ${answer}`)
    .join("\n\n");
  const normalizedSubmittedText = submittedText.trim();
  const serializedAnswers = answers.map(
    ({ answer, answerSchema, prompt, questionId }) => ({
      answer,
      answer_schema: answerSchema ?? null,
      prompt,
      question_id: questionId,
    }),
  );
  const duplicateThreshold = new Date(
    Date.now() - SUBMISSION_DUPLICATE_WINDOW_MS,
  ).toISOString();
  const { data: recentDuplicate, error: duplicateLookupError } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", user.id)
    .eq("lesson_slug", lessonDefinition.slug)
    .eq("exercise_id", exerciseDefinition.id)
    .eq("submitted_text", normalizedSubmittedText)
    .gte("created_at", duplicateThreshold)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (duplicateLookupError) {
    console.error("Error checking for duplicate exercise submission:", {
      code: duplicateLookupError.code,
      message: duplicateLookupError.message,
      details: duplicateLookupError.details,
      hint: duplicateLookupError.hint,
      exerciseId,
      lessonSlug,
      userId: user.id,
    });
  } else if (recentDuplicate) {
    revalidateDashboardPaths();
    revalidatePath(`/grammar/${lessonDefinition.slug}`);

    return { success: true };
  }

  if (!hasAvailableRateLimitProtection()) {
    return {
      success: false,
      error: "Exercise submission is temporarily unavailable.",
    };
  }

  const exerciseRateLimit = await consumeRateLimit({
    identifier: getUserRateLimitIdentifier(user.id),
    limit: 6,
    namespace: `exercise:${exerciseDefinition.id}`,
    windowMs: 60 * 60 * 1000,
  });

  if (!exerciseRateLimit.ok) {
    return {
      success: false,
      error:
        "Too many submissions were received for this lesson. Please wait a bit before trying again.",
    };
  }

  const submission: SubmissionInsert = {
    answers: serializedAnswers,
    exercise_id: exerciseDefinition.id,
    user_id: user.id,
    lesson_slug: lessonDefinition.slug,
    submission_intent_id: submissionIntentId,
    submitted_language: exerciseLanguage,
    submitted_text: normalizedSubmittedText,
    status: "pending",
  };

  const { data: submissionRow, error } = await supabase
    .from("submissions")
    .insert([submission])
    .select("id")
    .single();

  if (error) {
    console.error("Error submitting exercise:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      exerciseId,
      lessonSlug,
      userId: user.id,
    });

    if (isMissingSupabaseTableError(error)) {
      return {
        success: false,
        error:
          "Exercise submissions are not configured yet. Please contact the administrator.",
      };
    }

    if (error.code === "42501") {
      return {
        success: false,
        error: "Your account does not have permission to submit exercises yet.",
      };
    }

    if (error.code === "23505") {
      revalidateDashboardPaths();
      revalidatePath(`/grammar/${lessonDefinition.slug}`);

      return { success: true };
    }

    return {
      success: false,
      error: "Failed to submit exercise. Please try again.",
    };
  }

  revalidateDashboardPaths();
  revalidatePath(`/grammar/${lessonDefinition.slug}`);

  if (!submissionRow) {
    return { success: true };
  }

  const ownerAlert = await dispatchLoggedOwnerAlertEmail({
    aggregateId: submissionRow.id,
    aggregateType: "submission",
    eventType: "exercise_submission_received",
    payload: {
      exercise_id: exerciseDefinition.id,
      lesson_slug: lessonDefinition.slug,
      submitted_language: exerciseLanguage,
      user_id: user.id,
    },
    subject: `Coptic Compass exercise submission: ${formatLessonSlug(lessonDefinition.slug)}`,
    text: [
      `Student: ${user.email ?? "Unknown email"}`,
      `Lesson: ${lessonDefinition.slug}`,
      `Exercise: ${exerciseDefinition.id}`,
      `Language: ${exerciseLanguage}`,
      `Answer count: ${answers.length}`,
      "",
      "Submission:",
      normalizedSubmittedText,
    ].join("\n"),
  });

  if (!ownerAlert.success) {
    console.error("Failed to send owner exercise submission alert", {
      error: ownerAlert.error,
      exerciseId,
      lessonSlug,
      userId: user.id,
    });
  }

  return { success: true };
}
