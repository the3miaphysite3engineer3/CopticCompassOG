import { siteConfig } from "@/lib/site";
import { getGrammarApiIndex, getGrammarApiManifest } from "./grammarApi";

type OpenApiDocument = Record<string, unknown>;

function createLocalizedStringSchema(description: string) {
  return {
    type: "object",
    description,
    required: ["en", "nl"],
    properties: {
      en: {
        type: "string",
      },
      nl: {
        type: "string",
      },
    },
    additionalProperties: false,
  };
}

function createVersionedEnvelopeSchema(dataSchemaRef: string, description: string) {
  return {
    type: "object",
    description,
    required: ["schemaVersion", "datasetVersion", "generatedAt", "data"],
    properties: {
      schemaVersion: {
        type: "string",
        example: "1.0.0",
      },
      datasetVersion: {
        type: "string",
        example: "2026-03-22",
      },
      generatedAt: {
        type: "string",
        format: "date-time",
        example: "2026-03-22T00:00:00.000Z",
      },
      data: {
        $ref: dataSchemaRef,
      },
    },
    additionalProperties: false,
  };
}

export function getGrammarOpenApiDocument(): OpenApiDocument {
  const apiIndex = getGrammarApiIndex();
  const manifest = getGrammarApiManifest();
  const publishedLesson = manifest.lessons.find((lesson) => lesson.status === "published");
  const exampleLessonId = publishedLesson?.id ?? "grammar.lesson.01";
  const exampleLessonSlug = publishedLesson?.slug ?? "lesson-1";
  const exampleConceptId = "grammar.concept.significant-letters";
  const exampleSourceId = "grammar.source.basisgrammatica-bohairisch-koptisch";

  return {
    openapi: "3.0.3",
    info: {
      title: apiIndex.name,
      version: manifest.datasetVersion,
      description: [
        "Versioned, read-only Coptic grammar dataset API.",
        "",
        apiIndex.description,
        "",
        "This API is intended for web clients, flashcard tools, mobile apps, and research scripts.",
        "Responses are versioned with schema and dataset metadata.",
        "Grammar lesson content is all-rights-reserved; check the rights fields before reuse.",
      ].join("\n"),
      contact: {
        name: siteConfig.author.name,
        url: siteConfig.liveUrl,
      },
      license: {
        name: "All rights reserved",
      },
    },
    servers: [
      {
        url: "/",
        description: "Current deployment",
      },
    ],
    tags: [
      {
        name: "Index",
        description: "Machine-readable discovery endpoints for the grammar dataset.",
      },
      {
        name: "Lessons",
        description: "Lesson index and full lesson bundles.",
      },
      {
        name: "Examples",
        description: "Sentence examples grouped by lesson.",
      },
      {
        name: "Exercises",
        description: "Exercise definitions for study or review workflows.",
      },
      {
        name: "Concepts",
        description: "Canonical grammar concepts and glossary-style records.",
      },
      {
        name: "Footnotes",
        description: "Footnotes attached to lessons.",
      },
      {
        name: "Sources",
        description: "Publication and source metadata referenced by lessons.",
      },
    ],
    externalDocs: {
      description: "Interactive API index",
      url: "/api/v1/grammar",
    },
    paths: {
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
    },
    components: {
      parameters: {
        LessonStatusFilter: {
          name: "status",
          in: "query",
          required: false,
          description: "Optional explicit filter for the public published lesson set.",
          schema: {
            type: "string",
            enum: ["published"],
          },
          example: "published",
        },
        LessonFilter: {
          name: "lesson",
          in: "query",
          required: false,
          description:
            "Lesson slug or canonical lesson id. Examples: `lesson-1`, `grammar.lesson.01`.",
          schema: {
            type: "string",
          },
          examples: {
            slug: {
              value: exampleLessonSlug,
            },
            canonicalId: {
              value: exampleLessonId,
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Invalid query parameter or unsupported filter value.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              examples: {
                invalidStatus: {
                  value: {
                    error: "Invalid lesson status filter: preview",
                  },
                },
                unknownLesson: {
                  value: {
                    error: "Unknown lesson filter: missing-lesson",
                  },
                },
              },
            },
          },
        },
        NotFound: {
          description: "Requested resource was not found.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                error: "Grammar lesson not found for slug: missing-lesson",
              },
            },
          },
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "string",
            },
          },
          additionalProperties: false,
        },
        GrammarApiPathExample: {
          type: "object",
          required: ["path", "description"],
          properties: {
            path: {
              type: "string",
              example: "/api/v1/grammar/lessons?status=published",
            },
            description: {
              type: "string",
              example: "List public lesson cards for the website or a mobile app.",
            },
          },
          additionalProperties: false,
        },
        GrammarApiEndpointDescription: {
          type: "object",
          required: ["path", "description"],
          properties: {
            path: {
              type: "string",
            },
            description: {
              type: "string",
            },
            queryParameters: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarRights: {
          type: "object",
          required: ["author", "copyrightHolder", "license", "statement"],
          properties: {
            author: {
              type: "string",
              example: siteConfig.author.name,
            },
            copyrightHolder: {
              type: "string",
              example: siteConfig.author.name,
            },
            license: {
              type: "string",
              enum: ["all-rights-reserved"],
              example: "all-rights-reserved",
            },
            statement: createLocalizedStringSchema(
              "Localized rights statement for the dataset or lesson.",
            ),
          },
          additionalProperties: false,
        },
        LocalizedString: createLocalizedStringSchema("Localized text in English and Dutch."),
        GrammarBlock: {
          type: "object",
          description:
            "Structured rich-text block. Common variants include paragraph, heading, list, table, callout, exampleGroup, and exerciseGroup.",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              example: "paragraph",
            },
          },
          additionalProperties: true,
        },
        GrammarInline: {
          type: "object",
          description:
            "Structured inline node used inside blocks. Common variants include text, coptic, strong, em, conceptRef, footnoteRef, and link.",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              example: "text",
            },
          },
          additionalProperties: true,
        },
        LocalizedBlockArray: {
          type: "object",
          required: ["en", "nl"],
          properties: {
            en: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarBlock",
              },
            },
            nl: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarBlock",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarLessonIndexItem: {
          type: "object",
          required: ["id", "slug", "number", "status", "title", "summary", "tags"],
          properties: {
            id: {
              type: "string",
              example: exampleLessonId,
            },
            slug: {
              type: "string",
              example: exampleLessonSlug,
            },
            number: {
              type: "integer",
              example: 1,
            },
            status: {
              type: "string",
              enum: ["published"],
              example: "published",
            },
            title: {
              $ref: "#/components/schemas/LocalizedString",
            },
            summary: {
              $ref: "#/components/schemas/LocalizedString",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarManifest: {
          type: "object",
          required: [
            "schemaVersion",
            "datasetVersion",
            "generatedAt",
            "locales",
            "rights",
            "lessons",
          ],
          properties: {
            schemaVersion: {
              type: "string",
              example: manifest.schemaVersion,
            },
            datasetVersion: {
              type: "string",
              example: manifest.datasetVersion,
            },
            generatedAt: {
              type: "string",
              format: "date-time",
              example: manifest.generatedAt,
            },
            locales: {
              type: "array",
              items: {
                type: "string",
                enum: ["en", "nl"],
              },
            },
            rights: {
              $ref: "#/components/schemas/GrammarRights",
            },
            lessons: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarLessonIndexItem",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarSectionDocument: {
          type: "object",
          required: [
            "id",
            "slug",
            "lessonId",
            "order",
            "title",
            "tags",
            "blocks",
            "conceptRefs",
            "exampleRefs",
            "exerciseRefs",
          ],
          properties: {
            id: {
              type: "string",
            },
            slug: {
              type: "string",
            },
            lessonId: {
              type: "string",
              example: exampleLessonId,
            },
            order: {
              type: "integer",
            },
            title: {
              $ref: "#/components/schemas/LocalizedString",
            },
            summary: {
              $ref: "#/components/schemas/LocalizedString",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
            blocks: {
              $ref: "#/components/schemas/LocalizedBlockArray",
            },
            conceptRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            exampleRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            exerciseRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarLessonDocument: {
          type: "object",
          required: [
            "id",
            "slug",
            "number",
            "status",
            "title",
            "summary",
            "tags",
            "sectionOrder",
            "sections",
            "conceptRefs",
            "exerciseRefs",
            "sourceRefs",
          ],
          properties: {
            id: {
              type: "string",
              example: exampleLessonId,
            },
            slug: {
              type: "string",
              example: exampleLessonSlug,
            },
            number: {
              type: "integer",
              example: 1,
            },
            status: {
              type: "string",
              enum: ["published"],
            },
            title: {
              $ref: "#/components/schemas/LocalizedString",
            },
            summary: {
              $ref: "#/components/schemas/LocalizedString",
            },
            description: {
              $ref: "#/components/schemas/LocalizedString",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
            rights: {
              $ref: "#/components/schemas/GrammarRights",
            },
            sectionOrder: {
              type: "array",
              items: {
                type: "string",
              },
            },
            sections: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarSectionDocument",
              },
            },
            conceptRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            exerciseRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            sourceRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarConceptDocument: {
          type: "object",
          required: ["id", "title", "definition", "tags", "relatedConceptRefs", "lessonRefs", "sourceRefs"],
          properties: {
            id: {
              type: "string",
              example: exampleConceptId,
            },
            title: {
              $ref: "#/components/schemas/LocalizedString",
            },
            definition: {
              $ref: "#/components/schemas/LocalizedBlockArray",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
            relatedConceptRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            lessonRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            sourceRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarExampleSegment: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
            },
            dictionaryEntryId: {
              type: "string",
            },
          },
          additionalProperties: false,
        },
        GrammarExampleDocument: {
          type: "object",
          required: [
            "id",
            "lessonId",
            "sectionId",
            "coptic",
            "translation",
            "conceptRefs",
            "dictionaryRefs",
            "tags",
          ],
          properties: {
            id: {
              type: "string",
            },
            lessonId: {
              type: "string",
              example: exampleLessonId,
            },
            sectionId: {
              type: "string",
            },
            coptic: {
              type: "string",
            },
            copticSegments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarExampleSegment",
              },
            },
            transliteration: {
              type: "string",
            },
            translation: {
              $ref: "#/components/schemas/LocalizedString",
            },
            notes: {
              $ref: "#/components/schemas/LocalizedBlockArray",
            },
            conceptRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            dictionaryRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            dictionaryTokenOverrides: {
              type: "object",
              additionalProperties: {
                type: "string",
              },
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarExerciseItem: {
          type: "object",
          required: ["id", "prompt"],
          properties: {
            id: {
              type: "string",
            },
            prompt: {
              $ref: "#/components/schemas/LocalizedString",
            },
            answerSchema: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  enum: ["free-text"],
                },
                minLength: {
                  type: "integer",
                },
                maxLength: {
                  type: "integer",
                },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        GrammarExerciseDocument: {
          type: "object",
          required: ["id", "lessonId", "kind", "title", "prompt", "items", "tags"],
          properties: {
            id: {
              type: "string",
            },
            lessonId: {
              type: "string",
              example: exampleLessonId,
            },
            sectionId: {
              type: "string",
            },
            kind: {
              type: "string",
              enum: ["translation", "multiple-choice", "short-answer", "reviewed"],
            },
            title: {
              $ref: "#/components/schemas/LocalizedString",
            },
            prompt: {
              $ref: "#/components/schemas/LocalizedBlockArray",
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarExerciseItem",
              },
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarFootnoteDocument: {
          type: "object",
          required: ["id", "lessonId", "content", "sourceRefs"],
          properties: {
            id: {
              type: "string",
            },
            lessonId: {
              type: "string",
              example: exampleLessonId,
            },
            content: {
              $ref: "#/components/schemas/LocalizedBlockArray",
            },
            sourceRefs: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarSourceDocument: {
          type: "object",
          required: ["id", "title"],
          properties: {
            id: {
              type: "string",
              example: exampleSourceId,
            },
            title: {
              type: "string",
            },
            subtitle: {
              type: "string",
            },
            author: {
              type: "string",
            },
            year: {
              type: "string",
            },
            url: {
              type: "string",
              format: "uri",
            },
            publicationId: {
              type: "string",
            },
            comingSoon: {
              type: "boolean",
            },
          },
          additionalProperties: false,
        },
        GrammarLessonBundle: {
          type: "object",
          required: ["lesson", "concepts", "examples", "exercises", "footnotes", "sources"],
          properties: {
            lesson: {
              $ref: "#/components/schemas/GrammarLessonDocument",
            },
            concepts: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarConceptDocument",
              },
            },
            examples: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarExampleDocument",
              },
            },
            exercises: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarExerciseDocument",
              },
            },
            footnotes: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarFootnoteDocument",
              },
            },
            sources: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarSourceDocument",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarApiIndex: {
          type: "object",
          required: [
            "name",
            "description",
            "schemaVersion",
            "datasetVersion",
            "generatedAt",
            "locales",
            "rights",
            "lessonCounts",
            "apiBasePath",
            "staticDataBasePath",
            "endpoints",
            "examples",
          ],
          properties: {
            name: {
              type: "string",
              example: apiIndex.name,
            },
            description: {
              type: "string",
              example: apiIndex.description,
            },
            schemaVersion: {
              type: "string",
              example: apiIndex.schemaVersion,
            },
            datasetVersion: {
              type: "string",
              example: apiIndex.datasetVersion,
            },
            generatedAt: {
              type: "string",
              format: "date-time",
              example: apiIndex.generatedAt,
            },
            locales: {
              type: "array",
              items: {
                type: "string",
                enum: ["en", "nl"],
              },
            },
            rights: {
              $ref: "#/components/schemas/GrammarRights",
            },
            lessonCounts: {
              type: "object",
              required: ["published", "draft", "archived", "total"],
              properties: {
                published: {
                  type: "integer",
                  example: 1,
                },
                draft: {
                  type: "integer",
                  example: 0,
                },
                archived: {
                  type: "integer",
                  example: 0,
                },
                total: {
                  type: "integer",
                  example: 1,
                },
              },
              additionalProperties: false,
            },
            apiBasePath: {
              type: "string",
              example: apiIndex.apiBasePath,
            },
            staticDataBasePath: {
              type: "string",
              example: apiIndex.staticDataBasePath,
            },
            endpoints: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarApiEndpointDescription",
              },
            },
            examples: {
              type: "array",
              items: {
                $ref: "#/components/schemas/GrammarApiPathExample",
              },
            },
          },
          additionalProperties: false,
        },
        GrammarLessonIndexEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarLessonIndexCollection",
          "Versioned lesson index response.",
        ),
        GrammarLessonIndexCollection: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GrammarLessonIndexItem",
          },
        },
        GrammarLessonBundleEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarLessonBundle",
          "Versioned lesson bundle response.",
        ),
        GrammarExampleCollectionEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarExampleCollection",
          "Versioned example collection response.",
        ),
        GrammarExampleCollection: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GrammarExampleDocument",
          },
        },
        GrammarExerciseCollectionEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarExerciseCollection",
          "Versioned exercise collection response.",
        ),
        GrammarExerciseCollection: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GrammarExerciseDocument",
          },
        },
        GrammarConceptCollectionEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarConceptCollection",
          "Versioned concept collection response.",
        ),
        GrammarConceptCollection: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GrammarConceptDocument",
          },
        },
        GrammarConceptEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarConceptDocument",
          "Versioned concept response.",
        ),
        GrammarFootnoteCollectionEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarFootnoteCollection",
          "Versioned footnote collection response.",
        ),
        GrammarFootnoteCollection: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GrammarFootnoteDocument",
          },
        },
        GrammarSourceCollectionEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarSourceCollection",
          "Versioned source collection response.",
        ),
        GrammarSourceCollection: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GrammarSourceDocument",
          },
        },
        GrammarSourceEnvelope: createVersionedEnvelopeSchema(
          "#/components/schemas/GrammarSourceDocument",
          "Versioned source response.",
        ),
      },
    },
  };
}
