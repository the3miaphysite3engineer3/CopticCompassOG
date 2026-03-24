export function formatLessonSlug(lessonSlug: string) {
  return lessonSlug.replace(/-/g, " ");
}

import type { Language } from "@/types/i18n";

export function formatSubmissionDate(
  createdAt: string,
  language: Language = "en",
) {
  return new Date(createdAt).toLocaleDateString(
    language === "nl" ? "nl-BE" : "en-US",
  );
}
