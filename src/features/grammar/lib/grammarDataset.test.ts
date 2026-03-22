import { describe, expect, it } from "vitest";
import {
  getGrammarExportData,
  getGrammarLessonBundleBySlug,
  getGrammarLessonOutlineBySlug,
  listPublishedGrammarLessons,
} from "./grammarDataset";

describe("grammar dataset adapter", () => {
  it("lists only published lessons for public lesson hubs", () => {
    const lessons = listPublishedGrammarLessons();

    expect(lessons.map((lesson) => lesson.slug)).toEqual(["lesson-1"]);
  });

  it("builds a lesson bundle by slug", () => {
    const bundle = getGrammarLessonBundleBySlug("lesson-1");

    expect(bundle).not.toBeNull();
    expect(bundle?.lesson.id).toBe("grammar.lesson.01");
    expect(bundle?.lesson.sections).toHaveLength(9);
    expect(bundle?.exercises.map((exercise) => exercise.id)).toEqual([
      "grammar.exercise.lesson01.001",
    ]);
  });

  it("derives a stable ordered lesson outline from section metadata", () => {
    const outline = getGrammarLessonOutlineBySlug("lesson-1");

    expect(outline?.map((section) => section.slug)).toEqual([
      "definitions",
      "vocabulary-bare-nouns",
      "significant-letters",
      "determiner-selection",
      "zero-determination",
      "bipartite-nominal-sentence",
      "independent-pronouns",
      "abbreviations",
      "exercise-01",
    ]);
  });

  it("creates an export snapshot keyed by lesson slug", () => {
    const exportSnapshot = getGrammarExportData();

    expect(exportSnapshot.manifest.datasetVersion).toBe("2026-03-22");
    expect(Object.keys(exportSnapshot.lessons)).toEqual(["lesson-1", "lesson-2"]);
    expect(exportSnapshot.lessons["lesson-1"]?.lesson.id).toBe("grammar.lesson.01");
  });
});
