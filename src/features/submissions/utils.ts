import type { Language } from "@/types/i18n";

/**
 * Converts a lesson slug into a simple human-readable label for submission
 * summaries and admin review cards.
 */
export function formatLessonSlug(lessonSlug: string) {
  return lessonSlug.replace(/-/g, " ");
}

/**
 * Formats submission timestamps for the current UI language.
 */
export function formatSubmissionDate(
  createdAt: string,
  language: Language = "en",
) {
  return new Date(createdAt).toLocaleDateString(
    language === "nl" ? "nl-BE" : "en-US",
  );
}
