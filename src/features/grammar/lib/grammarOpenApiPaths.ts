import type { GrammarOpenApiContext } from "./grammarOpenApiShared";

/**
 * Builds the path map for the published grammar OpenAPI document using the
 * current dataset examples and shared parameter/response components.
 */
export function buildGrammarOpenApiPaths(context: GrammarOpenApiContext) {
  const {
    apiIndex,
    exampleConceptId,
    exampleLessonSlug,
    exampleSourceId,
    manifest,
  } = context;

  return {
    "/api/v1/grammar": {
      get: {
        tags: ["Index"],
        summary: "Get the API index",
        description:
          "Returns a machine-readable index of the public grammar API surface, including endpoint descriptions and example paths.",
        operationId: "getGrammarApiIndex",
        responses: {
          "200": {
            description: "Grammar API index",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarApiIndex",
                },
                example: apiIndex,
              },
            },
          },
        },
      },
    },
    "/api/v1/grammar/manifest": {
      get: {
        tags: ["Index"],
        summary: "Get the dataset manifest",
        description:
          "Returns the canonical manifest for the grammar dataset, including lesson metadata, locales, rights, and dataset version.",
        operationId: "getGrammarManifest",
        responses: {
          "200": {
            description: "Grammar manifest",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarManifest",
                },
                example: manifest,
              },
            },
          },
        },
      },
    },
    "/api/v1/grammar/lessons": {
      get: {
        tags: ["Lessons"],
        summary: "List lessons",
        description:
          "Returns published lesson index records. The optional status filter only accepts `published` for explicit public-only requests.",
        operationId: "listGrammarLessons",
        parameters: [
          {
            $ref: "#/components/parameters/LessonStatusFilter",
          },
        ],
        responses: {
          "200": {
            description: "Lesson index records",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarLessonIndexEnvelope",
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/BadRequest",
          },
        },
      },
    },
    "/api/v1/grammar/lessons/{slug}": {
      get: {
        tags: ["Lessons"],
        summary: "Get a lesson bundle",
        description:
          "Returns a full lesson bundle including the lesson document, concepts, examples, exercises, footnotes, and sources.",
        operationId: "getGrammarLessonBySlug",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            description: "Lesson slug, for example `lesson-1`.",
            schema: {
              type: "string",
            },
            example: exampleLessonSlug,
          },
        ],
        responses: {
          "200": {
            description: "Full lesson bundle",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarLessonBundleEnvelope",
                },
              },
            },
          },
          "404": {
            $ref: "#/components/responses/NotFound",
          },
        },
      },
    },
    "/api/v1/grammar/examples": {
      get: {
        tags: ["Examples"],
        summary: "List examples",
        description:
          "Returns example records across the dataset or filtered to a lesson. The lesson filter accepts either a slug like `lesson-1` or a canonical id like `grammar.lesson.01`.",
        operationId: "listGrammarExamples",
        parameters: [
          {
            $ref: "#/components/parameters/LessonFilter",
          },
        ],
        responses: {
          "200": {
            description: "Example records",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarExampleCollectionEnvelope",
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/BadRequest",
          },
        },
      },
    },
    "/api/v1/grammar/exercises": {
      get: {
        tags: ["Exercises"],
        summary: "List exercises",
        description:
          "Returns exercise records across the dataset or filtered to a lesson. Exercise submission itself is not part of this public API.",
        operationId: "listGrammarExercises",
        parameters: [
          {
            $ref: "#/components/parameters/LessonFilter",
          },
        ],
        responses: {
          "200": {
            description: "Exercise records",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarExerciseCollectionEnvelope",
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/BadRequest",
          },
        },
      },
    },
    "/api/v1/grammar/concepts": {
      get: {
        tags: ["Concepts"],
        summary: "List concepts",
        description:
          "Returns canonical concept records across the dataset or filtered to a lesson.",
        operationId: "listGrammarConcepts",
        parameters: [
          {
            $ref: "#/components/parameters/LessonFilter",
          },
        ],
        responses: {
          "200": {
            description: "Concept records",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarConceptCollectionEnvelope",
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/BadRequest",
          },
        },
      },
    },
    "/api/v1/grammar/concepts/{id}": {
      get: {
        tags: ["Concepts"],
        summary: "Get a concept",
        description: "Returns one concept record by canonical concept id.",
        operationId: "getGrammarConceptById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Canonical concept id.",
            schema: {
              type: "string",
            },
            example: exampleConceptId,
          },
        ],
        responses: {
          "200": {
            description: "Concept record",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarConceptEnvelope",
                },
              },
            },
          },
          "404": {
            $ref: "#/components/responses/NotFound",
          },
        },
      },
    },
    "/api/v1/grammar/footnotes": {
      get: {
        tags: ["Footnotes"],
        summary: "List footnotes",
        description:
          "Returns footnote records across the dataset or filtered to a lesson.",
        operationId: "listGrammarFootnotes",
        parameters: [
          {
            $ref: "#/components/parameters/LessonFilter",
          },
        ],
        responses: {
          "200": {
            description: "Footnote records",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarFootnoteCollectionEnvelope",
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/BadRequest",
          },
        },
      },
    },
    "/api/v1/grammar/sources": {
      get: {
        tags: ["Sources"],
        summary: "List sources",
        description:
          "Returns source records across the dataset or filtered to a lesson.",
        operationId: "listGrammarSources",
        parameters: [
          {
            $ref: "#/components/parameters/LessonFilter",
          },
        ],
        responses: {
          "200": {
            description: "Source records",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarSourceCollectionEnvelope",
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/BadRequest",
          },
        },
      },
    },
    "/api/v1/grammar/sources/{id}": {
      get: {
        tags: ["Sources"],
        summary: "Get a source",
        description: "Returns one source record by canonical source id.",
        operationId: "getGrammarSourceById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Canonical source id.",
            schema: {
              type: "string",
            },
            example: exampleSourceId,
          },
        ],
        responses: {
          "200": {
            description: "Source record",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GrammarSourceEnvelope",
                },
              },
            },
          },
          "404": {
            $ref: "#/components/responses/NotFound",
          },
        },
      },
    },
  };
}
