import type {
  GrammarDatasetSnapshot,
  GrammarManifest,
  GrammarLessonBundle,
  GrammarLessonDocument,
} from "./schema.ts";
import { enrichGrammarDatasetSnapshotWithDictionaryLinks } from "./dictionary-links.ts";
import { getGrammarDatasetSnapshot } from "./registry.ts";

function createGrammarLessonBundleFromSnapshot(
  lesson: GrammarLessonDocument,
  snapshot: GrammarDatasetSnapshot,
): GrammarLessonBundle {
  const enrichedLesson =
    snapshot.lessons.find((candidate) => candidate.id === lesson.id) ?? lesson;

  const exerciseIds = new Set(enrichedLesson.exerciseRefs);
  const sectionExerciseIds = new Set(
    enrichedLesson.sections.flatMap((section) => section.exerciseRefs),
  );
  const bundledExercises = snapshot.exercises.filter(
    (exercise) => exerciseIds.has(exercise.id) || sectionExerciseIds.has(exercise.id),
  );

  return {
    lesson: enrichedLesson,
    concepts: snapshot.concepts.filter((concept) =>
      enrichedLesson.conceptRefs.includes(concept.id),
    ),
    examples: snapshot.examples.filter((example) => example.lessonId === enrichedLesson.id),
    exercises: bundledExercises,
    footnotes: snapshot.footnotes.filter((footnote) => footnote.lessonId === enrichedLesson.id),
    sources: snapshot.sources.filter((source) => enrichedLesson.sourceRefs.includes(source.id)),
  };
}

export function createGrammarLessonBundle(
  lesson: GrammarLessonDocument,
  snapshot: GrammarDatasetSnapshot = getGrammarDatasetSnapshot(),
): GrammarLessonBundle {
  return createGrammarLessonBundleFromSnapshot(
    lesson,
    enrichGrammarDatasetSnapshotWithDictionaryLinks(snapshot),
  );
}

export function createGrammarExportSnapshot(
  snapshot: GrammarDatasetSnapshot = getGrammarDatasetSnapshot(),
) {
  const enrichedSnapshot = enrichGrammarDatasetSnapshotWithDictionaryLinks(snapshot);

  return {
    manifest: enrichedSnapshot.manifest,
    lessons: Object.fromEntries(
      enrichedSnapshot.lessons.map((lesson) => [
        lesson.slug,
        createGrammarLessonBundleFromSnapshot(lesson, enrichedSnapshot),
      ]),
    ),
  };
}

export function createGrammarStaticExportFiles(
  snapshot: GrammarDatasetSnapshot = getGrammarDatasetSnapshot(),
): GrammarStaticExportFile[] {
  const enrichedSnapshot = enrichGrammarDatasetSnapshotWithDictionaryLinks(snapshot);
  const exportSnapshot = createGrammarExportSnapshot(enrichedSnapshot);
  const files: GrammarStaticExportFile[] = [
    {
      outputPath: "grammar/v1/manifest.json",
      payload: exportSnapshot.manifest,
    },
    {
      outputPath: "grammar/v1/concepts.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, enrichedSnapshot.concepts),
    },
    {
      outputPath: "grammar/v1/examples.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, enrichedSnapshot.examples),
    },
    {
      outputPath: "grammar/v1/exercises.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, enrichedSnapshot.exercises),
    },
    {
      outputPath: "grammar/v1/footnotes.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, enrichedSnapshot.footnotes),
    },
    {
      outputPath: "grammar/v1/sources.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, enrichedSnapshot.sources),
    },
  ];

  enrichedSnapshot.lessons.forEach((lesson) => {
    files.push({
      outputPath: `grammar/v1/lessons/${lesson.slug}.json`,
      payload: createGrammarVersionedExport(
        exportSnapshot.manifest,
        exportSnapshot.lessons[lesson.slug],
      ),
    });
  });

  return files;
}

export type GrammarVersionedExport<T> = {
  schemaVersion: GrammarManifest["schemaVersion"];
  datasetVersion: string;
  generatedAt: string;
  data: T;
};

export type GrammarStaticExportFile = {
  outputPath: string;
  payload: unknown;
};

export function createGrammarVersionedExport<T>(
  manifest: GrammarManifest,
  data: T,
): GrammarVersionedExport<T> {
  return {
    schemaVersion: manifest.schemaVersion,
    datasetVersion: manifest.datasetVersion,
    generatedAt: manifest.generatedAt,
    data,
  };
}
