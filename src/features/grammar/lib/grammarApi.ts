import {
  createGrammarLessonBundle,
  createGrammarVersionedExport,
  type GrammarVersionedExport,
} from "@/content/grammar/build";
import {
  getGrammarConceptDocumentById,
  getGrammarDatasetSnapshot,
  getGrammarLessonDocumentById,
  getGrammarLessonDocumentBySlug,
  getGrammarManifest,
  getGrammarSourceDocumentById,
} from "@/content/grammar/registry";
import type {
  GrammarConceptDocument,
  GrammarExampleDocument,
  GrammarExerciseDocument,
  GrammarFootnoteDocument,
  GrammarLessonBundle,
  GrammarLessonId,
  GrammarLessonIndexItem,
  GrammarLessonStatus,
  GrammarManifest,
  GrammarRights,
  GrammarSourceDocument,
} from "@/content/grammar/schema";

export type GrammarApiEnvelope<T> = GrammarVersionedExport<T>;
export type GrammarApiPathExample = {
  path: string;
  description: string;
};
export type GrammarApiEndpointDescription = GrammarApiPathExample & {
  queryParameters?: string[];
};
export type GrammarApiIndex = {
  name: string;
  description: string;
  schemaVersion: GrammarManifest["schemaVersion"];
  datasetVersion: string;
  generatedAt: string;
  locales: GrammarManifest["locales"];
  rights: GrammarRights;
  lessonCounts: {
    published: number;
    draft: number;
    archived: number;
    total: number;
  };
  apiBasePath: string;
  staticDataBasePath: string;
  endpoints: GrammarApiEndpointDescription[];
  examples: GrammarApiPathExample[];
};

function getGrammarApiManifestSnapshot(): GrammarManifest {
  return getGrammarManifest();
}

export function getGrammarApiManifest() {
  return getGrammarApiManifestSnapshot();
}

export function isGrammarLessonStatus(value: string | null): value is GrammarLessonStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export function resolveGrammarLessonFilter(
  lessonFilter: string | null | undefined,
): GrammarLessonId | null {
  if (!lessonFilter) {
    return null;
  }

  const normalizedLessonFilter = lessonFilter.trim();

  if (!normalizedLessonFilter) {
    return null;
  }

  const lessonBySlug = getGrammarLessonDocumentBySlug(normalizedLessonFilter);

  if (lessonBySlug) {
    return lessonBySlug.id;
  }

  return getGrammarLessonDocumentById(normalizedLessonFilter)?.id ?? null;
}

export function listGrammarApiLessons(
  status?: GrammarLessonStatus,
): GrammarApiEnvelope<GrammarLessonIndexItem[]> {
  const manifest = getGrammarApiManifestSnapshot();
  const lessons = status
    ? manifest.lessons.filter((lesson) => lesson.status === status)
    : manifest.lessons;

  return createGrammarVersionedExport(manifest, lessons);
}

export function getGrammarApiLessonBySlug(
  slug: string,
): GrammarApiEnvelope<GrammarLessonBundle> | null {
  const lesson = getGrammarLessonDocumentBySlug(slug);

  if (!lesson) {
    return null;
  }

  const snapshot = getGrammarDatasetSnapshot();

  return createGrammarVersionedExport(
    snapshot.manifest,
    createGrammarLessonBundle(lesson, snapshot),
  );
}

export function listGrammarApiExamples(
  lessonId?: GrammarLessonId,
): GrammarApiEnvelope<GrammarExampleDocument[]> {
  const snapshot = getGrammarDatasetSnapshot();
  const examples = lessonId
    ? snapshot.examples.filter((example) => example.lessonId === lessonId)
    : snapshot.examples;

  return createGrammarVersionedExport(snapshot.manifest, examples);
}

export function listGrammarApiExercises(
  lessonId?: GrammarLessonId,
): GrammarApiEnvelope<GrammarExerciseDocument[]> {
  const snapshot = getGrammarDatasetSnapshot();
  const exercises = lessonId
    ? snapshot.exercises.filter((exercise) => exercise.lessonId === lessonId)
    : snapshot.exercises;

  return createGrammarVersionedExport(snapshot.manifest, exercises);
}

export function listGrammarApiConcepts(
  lessonId?: GrammarLessonId,
): GrammarApiEnvelope<GrammarConceptDocument[]> {
  const snapshot = getGrammarDatasetSnapshot();
  const concepts = lessonId
    ? snapshot.concepts.filter((concept) => concept.lessonRefs.includes(lessonId))
    : snapshot.concepts;

  return createGrammarVersionedExport(snapshot.manifest, concepts);
}

export function getGrammarApiConceptById(
  id: string,
): GrammarApiEnvelope<GrammarConceptDocument> | null {
  const snapshot = getGrammarDatasetSnapshot();
  const concept = getGrammarConceptDocumentById(id);

  if (!concept) {
    return null;
  }

  return createGrammarVersionedExport(snapshot.manifest, concept);
}

export function listGrammarApiFootnotes(
  lessonId?: GrammarLessonId,
): GrammarApiEnvelope<GrammarFootnoteDocument[]> {
  const snapshot = getGrammarDatasetSnapshot();
  const footnotes = lessonId
    ? snapshot.footnotes.filter((footnote) => footnote.lessonId === lessonId)
    : snapshot.footnotes;

  return createGrammarVersionedExport(snapshot.manifest, footnotes);
}

export function listGrammarApiSources(
  lessonId?: GrammarLessonId,
): GrammarApiEnvelope<GrammarSourceDocument[]> {
  const snapshot = getGrammarDatasetSnapshot();

  if (!lessonId) {
    return createGrammarVersionedExport(snapshot.manifest, snapshot.sources);
  }

  const lesson = getGrammarLessonDocumentById(lessonId);
  const lessonSourceIds = new Set(lesson?.sourceRefs ?? []);
  const sources = snapshot.sources.filter((source) => lessonSourceIds.has(source.id));

  return createGrammarVersionedExport(snapshot.manifest, sources);
}

export function getGrammarApiSourceById(
  id: string,
): GrammarApiEnvelope<GrammarSourceDocument> | null {
  const snapshot = getGrammarDatasetSnapshot();
  const source = getGrammarSourceDocumentById(id);

  if (!source) {
    return null;
  }

  return createGrammarVersionedExport(snapshot.manifest, source);
}

export function getGrammarApiIndex(): GrammarApiIndex {
  const manifest = getGrammarApiManifestSnapshot();
  const lessonStatuses = manifest.lessons.reduce(
    (accumulator, lesson) => {
      accumulator[lesson.status] += 1;
      return accumulator;
    },
    {
      published: 0,
      draft: 0,
      archived: 0,
    },
  );

  return {
    name: "Kyrillos Wannes Grammar API",
    description:
      "Versioned grammar lesson data for web clients, flashcard tools, mobile apps, and research scripts.",
    schemaVersion: manifest.schemaVersion,
    datasetVersion: manifest.datasetVersion,
    generatedAt: manifest.generatedAt,
    locales: manifest.locales,
    rights: manifest.rights,
    lessonCounts: {
      ...lessonStatuses,
      total: manifest.lessons.length,
    },
    apiBasePath: "/api/v1/grammar",
    staticDataBasePath: "/data/grammar/v1",
    endpoints: [
      {
        path: "/api/v1/grammar/manifest",
        description: "Returns the canonical manifest for the published grammar dataset.",
      },
      {
        path: "/api/v1/grammar/lessons",
        description: "Returns lesson index records.",
        queryParameters: ["status=draft|published|archived"],
      },
      {
        path: "/api/v1/grammar/lessons/[slug]",
        description: "Returns a full lesson bundle, including sections, examples, exercises, and footnotes.",
      },
      {
        path: "/api/v1/grammar/examples",
        description: "Returns example records across the dataset or for a specific lesson.",
        queryParameters: ["lesson=<lesson-slug-or-id>"],
      },
      {
        path: "/api/v1/grammar/exercises",
        description: "Returns exercise records across the dataset or for a specific lesson.",
        queryParameters: ["lesson=<lesson-slug-or-id>"],
      },
      {
        path: "/api/v1/grammar/concepts",
        description: "Returns concept records across the dataset or for a specific lesson.",
        queryParameters: ["lesson=<lesson-slug-or-id>"],
      },
      {
        path: "/api/v1/grammar/concepts/[id]",
        description: "Returns a single concept record by canonical concept id.",
      },
      {
        path: "/api/v1/grammar/footnotes",
        description: "Returns footnote records across the dataset or for a specific lesson.",
        queryParameters: ["lesson=<lesson-slug-or-id>"],
      },
      {
        path: "/api/v1/grammar/sources",
        description: "Returns source records across the dataset or for a specific lesson.",
        queryParameters: ["lesson=<lesson-slug-or-id>"],
      },
      {
        path: "/api/v1/grammar/sources/[id]",
        description: "Returns a single source record by canonical source id.",
      },
    ],
    examples: [
      {
        path: "/api/v1/grammar/lessons?status=published",
        description: "List public lesson cards for the website or a mobile app.",
      },
      {
        path: "/api/v1/grammar/lessons/lesson-1",
        description: "Fetch the full bundle for Lesson 1.",
      },
      {
        path: "/api/v1/grammar/examples?lesson=lesson-1",
        description: "Fetch only the examples for Lesson 1.",
      },
      {
        path: "/api/v1/grammar/concepts/grammar.concept.significant-letters",
        description: "Fetch one canonical concept record for glossary or flashcard tooling.",
      },
      {
        path: "/api/v1/grammar/footnotes?lesson=grammar.lesson.01",
        description: "Fetch footnotes for a lesson using the canonical lesson id.",
      },
      {
        path: "/api/v1/grammar/sources/grammar.source.basisgrammatica-bohairisch-koptisch",
        description: "Fetch the lesson's canonical publication source record.",
      },
      {
        path: "/data/grammar/v1/manifest.json",
        description: "Read the static grammar manifest without hitting the API layer.",
      },
      {
        path: "/data/grammar/v1/lessons/lesson-1.json",
        description: "Read the static lesson bundle JSON for Lesson 1.",
      },
    ],
  };
}
