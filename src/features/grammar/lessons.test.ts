import { describe, expect, it } from "vitest";

import { grammarLessons } from "./lessons";

describe("grammar lesson metadata", () => {
  it("assigns a stable unique id to each lesson", () => {
    const lessonIds = grammarLessons.map((lesson) => lesson.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
  });

  it("keeps section ids unique within each lesson", () => {
    grammarLessons.forEach((lesson) => {
      const sectionIds = lesson.sections.map((section) => section.id);
      expect(new Set(sectionIds).size).toBe(sectionIds.length);
    });
  });
});
