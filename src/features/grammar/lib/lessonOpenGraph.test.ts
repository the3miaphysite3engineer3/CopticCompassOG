import { describe, expect, it } from "vitest";

import { getPublishedGrammarLessonBundleBySlug } from "./grammarDataset";
import {
  buildLessonOpenGraphImageUrl,
  buildLessonOpenGraphPreview,
} from "./lessonOpenGraph";

describe("lesson Open Graph helpers", () => {
  it("builds a stable lesson-specific Open Graph image URL", () => {
    expect(
      buildLessonOpenGraphImageUrl("lesson-1", "nl", "https://example.com"),
    ).toBe("https://example.com/api/og?type=lesson&locale=nl&slug=lesson-1");
  });

  it("builds a localized preview for published grammar lessons", () => {
    const lessonBundle = getPublishedGrammarLessonBundleBySlug("lesson-1");

    expect(lessonBundle).not.toBeNull();

    const preview = buildLessonOpenGraphPreview(lessonBundle!, "en");

    expect(preview.eyebrow).toBe("Coptic Grammar");
    expect(preview.footerLabel).toBe("Coptic Compass • Grammar");
    expect(preview.lessonLabel).toBe("Lesson 01");
    expect(preview.title.length).toBeGreaterThan(0);
    expect(preview.summary.length).toBeGreaterThan(0);
    expect(preview.stats).toHaveLength(3);
  });
});
