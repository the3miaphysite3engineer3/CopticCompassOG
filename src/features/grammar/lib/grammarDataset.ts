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

type GrammarLessonOutlineItem = Pick<
  GrammarSectionDocument,
  "id" | "slug" | "title"
>;

/**
 * Formats a localized count label for SEO and metadata copy.
 */
function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Builds the localized SEO title for a grammar lesson from the lesson number
 * and summary text.
 */
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

/**
 * Builds the localized SEO description for a grammar lesson, including the
 * lesson footprint in sections, concepts, and exercises.
 */
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

/**
 * Returns the generated grammar manifest used by APIs and static exports.
 */
function _getGrammarManifestData() {
  return getGrammarManifest();
}

/**
 * Lists every grammar lesson index item, including unpublished lessons.
 */
export function listGrammarLessons(): GrammarLessonIndexItem[] {
  return listGrammarLessonIndexItems();
}

/**
 * Lists only published grammar lesson index items.
 */
export function listPublishedGrammarLessons(): GrammarLessonIndexItem[] {
  return listGrammarLessons().filter((lesson) => lesson.status === "published");
}

/**
 * Resolves a lesson bundle by slug, including concepts and exercises derived
 * from the underlying lesson document.
 */
export function getGrammarLessonBundleBySlug(
  slug: string,
): GrammarLessonBundle | null {
  const lesson = getGrammarLessonDocumentBySlug(slug);

  if (!lesson) {
    return null;
  }

  return createGrammarLessonBundle(lesson);
}

/**
 * Resolves a lesson bundle only when the lesson exists and is published.
 */
export function getPublishedGrammarLessonBundleBySlug(
  slug: string,
): GrammarLessonBundle | null {
  const bundle = getGrammarLessonBundleBySlug(slug);

  if (!bundle || bundle.lesson.status !== "published") {
    return null;
  }

  return bundle;
}

/**
 * Builds the ordered section outline for a lesson so navigation can follow the
 * lesson's declared section order rather than raw storage order.
 */
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

/**
 * Returns the generated grammar export snapshot used by static APIs and build
 * outputs.
 */
export function getGrammarExportData() {
  return createGrammarExportSnapshot();
}
