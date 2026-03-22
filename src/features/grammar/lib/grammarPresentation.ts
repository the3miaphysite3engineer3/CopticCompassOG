import type {
  GrammarConceptDocument,
  GrammarLessonBundle,
  GrammarSourceDocument,
} from "@/content/grammar/schema";

function normalizeReferenceAnchorSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getGrammarConceptAnchorId(conceptId: string) {
  const normalizedId = conceptId.replace(/^grammar\.concept\./, "");
  return `concept-${normalizeReferenceAnchorSegment(normalizedId)}`;
}

export function getGrammarSourceAnchorId(sourceId: string) {
  const normalizedId = sourceId.replace(/^grammar\.source\./, "");
  return `source-${normalizeReferenceAnchorSegment(normalizedId)}`;
}

export function getOrderedLessonConcepts(
  lessonBundle: GrammarLessonBundle,
): GrammarConceptDocument[] {
  const conceptsById = new Map(
    lessonBundle.concepts.map((concept) => [concept.id, concept] as const),
  );

  return lessonBundle.lesson.conceptRefs
    .map((conceptId) => conceptsById.get(conceptId))
    .filter((concept): concept is GrammarConceptDocument => concept !== undefined);
}

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
