import type { ContentReleaseCandidate } from "@/features/communications/lib/releases";
import { listPublishedGrammarLessons } from "@/features/grammar/lib/grammarDataset";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import {
  buildPublicationTitle,
  getPublicationPath,
  publications,
} from "@/features/publications/lib/publications";
import { assertServerOnly } from "@/lib/server/assertServerOnly";

/**
 * Builds the complete list of currently publishable lesson and publication
 * items that admins can attach to a content release draft.
 */
export function listContentReleaseCandidates(): ContentReleaseCandidate[] {
  assertServerOnly("listContentReleaseCandidates");

  const lessonCandidates = listPublishedGrammarLessons().map((lesson) => ({
    id: `lesson:${lesson.slug}`,
    itemId: lesson.slug,
    itemType: "lesson" as const,
    summaryEn: lesson.summary.en,
    summaryNl: lesson.summary.nl,
    title: lesson.title.en,
    url: getGrammarLessonPath(lesson.slug),
  }));

  const publicationCandidates = publications
    .filter((publication) => publication.status === "published")
    .map((publication) => ({
      id: `publication:${publication.id}`,
      itemId: publication.id,
      itemType: "publication" as const,
      summaryEn: publication.summary.en,
      summaryNl: publication.summary.nl,
      title: buildPublicationTitle(publication),
      url: getPublicationPath(publication.id),
    }));

  return [...lessonCandidates, ...publicationCandidates];
}

/**
 * Indexes release candidates by the persisted `type:id` key stored on release
 * items so admin actions can validate selections quickly.
 */
export function getContentReleaseCandidateMap() {
  assertServerOnly("getContentReleaseCandidateMap");

  return new Map(
    listContentReleaseCandidates().map((candidate) => [
      candidate.id,
      candidate,
    ]),
  );
}
