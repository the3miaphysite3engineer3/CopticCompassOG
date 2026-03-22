import type {
  GrammarDatasetSnapshot,
  GrammarExerciseDocument,
  GrammarManifest,
  GrammarLessonBundle,
  GrammarLessonDocument,
} from "./schema.ts";
import {
  getGrammarDatasetSnapshot,
  getGrammarExerciseDocumentById,
} from "./registry.ts";

function getExercisesForLessonDocument(lesson: GrammarLessonDocument): GrammarExerciseDocument[] {
  return lesson.exerciseRefs
    .map((exerciseId) => getGrammarExerciseDocumentById(exerciseId))
    .filter((exercise): exercise is GrammarExerciseDocument => exercise !== null);
}

export function createGrammarLessonBundle(
  lesson: GrammarLessonDocument,
  snapshot: GrammarDatasetSnapshot = getGrammarDatasetSnapshot(),
): GrammarLessonBundle {
  const exerciseIds = new Set(lesson.exerciseRefs);
  const sectionExerciseIds = new Set(
    lesson.sections.flatMap((section) => section.exerciseRefs),
  );
  const bundledExercises = snapshot.exercises.filter(
    (exercise) => exerciseIds.has(exercise.id) || sectionExerciseIds.has(exercise.id),
  );

  return {
    lesson,
    concepts: snapshot.concepts.filter((concept) =>
      lesson.conceptRefs.includes(concept.id),
    ),
    examples: snapshot.examples.filter((example) => example.lessonId === lesson.id),
    exercises: bundledExercises.length > 0 ? bundledExercises : getExercisesForLessonDocument(lesson),
    footnotes: snapshot.footnotes.filter((footnote) => footnote.lessonId === lesson.id),
    sources: snapshot.sources.filter((source) => lesson.sourceRefs.includes(source.id)),
  };
}

export function createGrammarExportSnapshot(
  snapshot: GrammarDatasetSnapshot = getGrammarDatasetSnapshot(),
) {
  return {
    manifest: snapshot.manifest,
    lessons: Object.fromEntries(
      snapshot.lessons.map((lesson) => [lesson.slug, createGrammarLessonBundle(lesson, snapshot)]),
    ),
  };
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

export function createGrammarStaticExportFiles(
  snapshot: GrammarDatasetSnapshot = getGrammarDatasetSnapshot(),
): GrammarStaticExportFile[] {
  const exportSnapshot = createGrammarExportSnapshot(snapshot);
  const files: GrammarStaticExportFile[] = [
    {
      outputPath: "grammar/v1/manifest.json",
      payload: exportSnapshot.manifest,
    },
    {
      outputPath: "grammar/v1/concepts.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, snapshot.concepts),
    },
    {
      outputPath: "grammar/v1/examples.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, snapshot.examples),
    },
    {
      outputPath: "grammar/v1/exercises.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, snapshot.exercises),
    },
    {
      outputPath: "grammar/v1/footnotes.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, snapshot.footnotes),
    },
    {
      outputPath: "grammar/v1/sources.json",
      payload: createGrammarVersionedExport(exportSnapshot.manifest, snapshot.sources),
    },
  ];

  snapshot.lessons.forEach((lesson) => {
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
