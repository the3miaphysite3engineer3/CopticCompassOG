import { grammarLesson01Document } from "./lessons/lesson-01.ts";
import { grammarLesson02Document } from "./lessons/lesson-02.ts";
import { grammarDatasetRights } from "./rights.ts";

import type { GrammarManifest } from "../schema.ts";

const datasetVersion = "2026-03-22";
const generatedAt = "2026-03-22T00:00:00.000Z";

const lessonDocuments = [grammarLesson01Document, grammarLesson02Document];

export const grammarManifestV1: GrammarManifest = {
  schemaVersion: "1.0.0",
  datasetVersion,
  generatedAt,
  locales: ["en", "nl"],
  rights: grammarDatasetRights,
  lessons: lessonDocuments.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    number: lesson.number,
    status: lesson.status,
    title: lesson.title,
    summary: lesson.summary,
    tags: lesson.tags,
  })),
};
