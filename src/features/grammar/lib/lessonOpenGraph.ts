import type { GrammarLessonBundle } from "@/content/grammar/schema";
import {
  buildOpenGraphImageUrl,
  getOpenGraphSectionFooter,
} from "@/features/seo/lib/openGraph";
import type { Language } from "@/types/i18n";

type LessonOpenGraphPreview = {
  eyebrow: string;
  footerLabel: string;
  lessonLabel: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
  summary: string;
  title: string;
};

/**
 * Formats a localized count label for lesson stats such as sections, concepts,
 * and exercises.
 */
function formatCount(
  count: number,
  locale: Language,
  singular: string,
  plural: string,
) {
  const value = count.toLocaleString(locale === "nl" ? "nl-BE" : "en-US");
  return `${value} ${count === 1 ? singular : plural}`;
}

/**
 * Builds the `/api/og` image URL for one grammar lesson preview card.
 */
export function buildLessonOpenGraphImageUrl(
  slug: string,
  language: Language,
  baseUrl?: string,
) {
  return buildOpenGraphImageUrl({
    baseUrl,
    locale: language,
    slug,
    type: "lesson",
  });
}

/**
 * Builds the grammar-lesson Open Graph preview payload from one published
 * lesson bundle and its localized counts.
 */
export function buildLessonOpenGraphPreview(
  lessonBundle: GrammarLessonBundle,
  locale: Language,
): LessonOpenGraphPreview {
  return {
    eyebrow: locale === "nl" ? "Koptische grammatica" : "Coptic Grammar",
    footerLabel: getOpenGraphSectionFooter("grammar", locale),
    lessonLabel:
      locale === "nl"
        ? `Les ${String(lessonBundle.lesson.number).padStart(2, "0")}`
        : `Lesson ${String(lessonBundle.lesson.number).padStart(2, "0")}`,
    stats: [
      {
        label: locale === "nl" ? "Opbouw" : "Structure",
        value: formatCount(
          lessonBundle.lesson.sections.length,
          locale,
          locale === "nl" ? "onderdeel" : "section",
          locale === "nl" ? "onderdelen" : "sections",
        ),
      },
      {
        label: locale === "nl" ? "Begrippen" : "Concepts",
        value: formatCount(
          lessonBundle.concepts.length,
          locale,
          locale === "nl" ? "begrip" : "concept",
          locale === "nl" ? "begrippen" : "concepts",
        ),
      },
      {
        label: locale === "nl" ? "Oefeningen" : "Exercises",
        value: formatCount(
          lessonBundle.exercises.length,
          locale,
          locale === "nl" ? "oefening" : "exercise",
          locale === "nl" ? "oefeningen" : "exercises",
        ),
      },
    ],
    summary:
      lessonBundle.lesson.description?.[locale] ??
      lessonBundle.lesson.summary[locale],
    title: lessonBundle.lesson.title[locale],
  };
}
