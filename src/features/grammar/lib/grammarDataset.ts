import {
  createGrammarExportSnapshot,
  createGrammarLessonBundle,
} from "@/content/grammar/build";
import {
  getGrammarManifest,
  getGrammarLessonDocumentBySlug,
  listGrammarLessonIndexItems,
} from "@/content/grammar/registry";
import type {
  GrammarLessonBundle,
  GrammarLessonDocument,
  GrammarLessonIndexItem,
  GrammarSectionDocument,
} from "@/content/grammar/schema";
import type { Language } from "@/types/i18n";

export type GrammarLessonOutlineItem = Pick<
  GrammarSectionDocument,
  "id" | "slug" | "title"
>;

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildGrammarLessonSeoTitle(
  lesson: Pick<GrammarLessonDocument, "number" | "summary">,
  locale: Language = "en",
) {
  const normalizedSummary = lesson.summary[locale].replace(/\.$/, "");
  const lessonNumber = String(lesson.number).padStart(2, "0");

  return locale === "nl"
    ? `Les Koptische grammatica ${lessonNumber}: ${normalizedSummary}`
    : `Coptic Grammar Lesson ${lessonNumber}: ${normalizedSummary}`;
}

export function buildGrammarLessonSeoDescription(
  lessonBundle: GrammarLessonBundle,
  locale: Language = "en",
) {
  const lesson = lessonBundle.lesson;
  const description = lesson.description?.[locale] ?? lesson.summary[locale];
  const lessonFootprint = [
    locale === "nl"
      ? pluralize(lesson.sections.length, "onderdeel", "onderdelen")
      : pluralize(lesson.sections.length, "section", "sections"),
    locale === "nl"
      ? pluralize(lessonBundle.concepts.length, "begrip", "begrippen")
      : pluralize(lessonBundle.concepts.length, "concept", "concepts"),
    locale === "nl"
      ? pluralize(lessonBundle.exercises.length, "oefening", "oefeningen")
      : pluralize(lessonBundle.exercises.length, "exercise", "exercises"),
  ].join(", ");

  return locale === "nl"
    ? `${description} Bevat ${lessonFootprint} voor gestructureerde studie van het Koptisch.`
    : `${description} Includes ${lessonFootprint} for structured Coptic study.`;
}

export function getGrammarManifestData() {
  return getGrammarManifest();
}

export function listGrammarLessons(): GrammarLessonIndexItem[] {
  return listGrammarLessonIndexItems();
}

export function listPublishedGrammarLessons(): GrammarLessonIndexItem[] {
  return listGrammarLessons().filter((lesson) => lesson.status === "published");
}

export function getGrammarLessonBundleBySlug(
  slug: string,
): GrammarLessonBundle | null {
  const lesson = getGrammarLessonDocumentBySlug(slug);

  if (!lesson) {
    return null;
  }

  return createGrammarLessonBundle(lesson);
}

export function getPublishedGrammarLessonBundleBySlug(
  slug: string,
): GrammarLessonBundle | null {
  const bundle = getGrammarLessonBundleBySlug(slug);

  if (!bundle || bundle.lesson.status !== "published") {
    return null;
  }

  return bundle;
}

export function getGrammarLessonOutlineBySlug(
  slug: string,
): GrammarLessonOutlineItem[] | null {
  const bundle = getGrammarLessonBundleBySlug(slug);

  if (!bundle) {
    return null;
  }

  const sectionsById = new Map(
    bundle.lesson.sections.map((section) => [section.id, section] as const),
  );

  return bundle.lesson.sectionOrder
    .map((sectionId) => sectionsById.get(sectionId))
    .filter(
      (section): section is GrammarSectionDocument => section !== undefined,
    )
    .map((section) => ({
      id: section.id,
      slug: section.slug,
      title: section.title,
    }));
}

export function getGrammarExportData() {
  return createGrammarExportSnapshot();
}
