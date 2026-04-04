import { describe, expect, it } from "vitest";
import { getGrammarOpenApiDocument } from "./grammarOpenApi";

describe("grammar OpenAPI document", () => {
  it("describes the public grammar routes and docs metadata", () => {
    const document = getGrammarOpenApiDocument() as {
      openapi: string;
      info: { title: string };
      paths: Record<string, unknown>;
      tags: Array<{ name: string }>;
      components: {
        parameters: Record<string, unknown>;
        schemas: Record<string, unknown>;
      };
    };

    expect(document.openapi).toBe("3.0.3");
    expect(document.info.title).toBe("Coptic Compass Grammar API");
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        "/api/v1/grammar",
        "/api/v1/grammar/manifest",
        "/api/v1/grammar/lessons",
        "/api/v1/grammar/lessons/{slug}",
        "/api/v1/grammar/examples",
        "/api/v1/grammar/exercises",
        "/api/v1/grammar/concepts",
        "/api/v1/grammar/concepts/{id}",
        "/api/v1/grammar/footnotes",
        "/api/v1/grammar/sources",
        "/api/v1/grammar/sources/{id}",
      ]),
    );
    expect(document.tags.map((tag) => tag.name)).toEqual(
      expect.arrayContaining([
        "Index",
        "Lessons",
        "Examples",
        "Exercises",
        "Concepts",
        "Footnotes",
        "Sources",
      ]),
    );
    expect(document.components.parameters).toHaveProperty("LessonFilter");
    expect(document.components.schemas).toHaveProperty("GrammarApiIndex");
    expect(document.components.schemas).toHaveProperty(
      "GrammarLessonBundleEnvelope",
    );
  });
});
