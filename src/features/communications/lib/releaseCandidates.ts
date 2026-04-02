import { listPublishedGrammarLessons } from "@/features/grammar/lib/grammarDataset";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import {
  buildPublicationTitle,
  getPublicationPath,
  publications,
} from "@/features/publications/lib/publications";
import { assertServerOnly } from "@/lib/server/assertServerOnly";
import type { ContentReleaseCandidate } from "@/features/communications/lib/releases";

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

export function getContentReleaseCandidateMap() {
  assertServerOnly("getContentReleaseCandidateMap");

  return new Map(
    listContentReleaseCandidates().map((candidate) => [
      candidate.id,
      candidate,
    ]),
  );
}
