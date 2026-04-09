import type {
  GrammarConceptDocument,
  GrammarLessonBundle,
  GrammarSourceDocument,
} from "@/content/grammar/schema";

type GrammarLessonAbbreviationAnchorKey =
  | "masculine"
  | "feminine"
  | "singular"
  | "plural"
  | "ipa"
  | "nm"
  | "enclitic-particle";

/**
 * Normalizes a reference label into a stable lowercase anchor segment.
 */
function normalizeReferenceAnchorSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds the in-page anchor id for a grammar concept reference.
 */
export function getGrammarConceptAnchorId(conceptId: string) {
  const normalizedId = conceptId.replace(/^grammar\.concept\./, "");
  return `concept-${normalizeReferenceAnchorSegment(normalizedId)}`;
}

/**
 * Builds the in-page anchor id for a grammar source reference.
 */
export function getGrammarSourceAnchorId(sourceId: string) {
  const normalizedId = sourceId.replace(/^grammar\.source\./, "");
  return `source-${normalizeReferenceAnchorSegment(normalizedId)}`;
}

/**
 * Builds the anchor id for the abbreviations section of a lesson page.
 */
export function getGrammarLessonAbbreviationSectionId(lessonId: string) {
  const normalizedId = lessonId.replace(/^grammar\.lesson\./, "");
  return `abbreviations-${normalizeReferenceAnchorSegment(normalizedId)}`;
}

/**
 * Builds the anchor id for one abbreviation entry inside a lesson's
 * abbreviations section.
 */
export function getGrammarLessonAbbreviationAnchorId(
  lessonId: string,
  key: GrammarLessonAbbreviationAnchorKey,
) {
  return `${getGrammarLessonAbbreviationSectionId(lessonId)}-${key}`;
}

/**
 * Orders concept records according to the lesson's referenced concept ids.
 */
export function getOrderedLessonConcepts(
  lessonBundle: GrammarLessonBundle,
): GrammarConceptDocument[] {
  const conceptsById = new Map(
    lessonBundle.concepts.map((concept) => [concept.id, concept] as const),
  );

  return lessonBundle.lesson.conceptRefs
    .map((conceptId) => conceptsById.get(conceptId))
    .filter(
      (concept): concept is GrammarConceptDocument => concept !== undefined,
    );
}

/**
 * Orders source records according to the lesson's referenced source ids.
 */
export function getOrderedLessonSources(
  lessonBundle: GrammarLessonBundle,
): GrammarSourceDocument[] {
  const sourcesById = new Map(
    lessonBundle.sources.map((source) => [source.id, source] as const),
  );

  return lessonBundle.lesson.sourceRefs
    .map((sourceId) => sourcesById.get(sourceId))
    .filter((source): source is GrammarSourceDocument => source !== undefined);
}
