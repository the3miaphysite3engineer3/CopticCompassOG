import { describe, expect, it } from "vitest";

import { getGrammarLessonBundleBySlug } from "./grammarDataset";
import {
  getGrammarConceptAnchorId,
  getGrammarSourceAnchorId,
  getOrderedLessonConcepts,
  getOrderedLessonSources,
} from "./grammarPresentation";

describe("grammar presentation helpers", () => {
  it("creates stable anchor ids for concepts and sources", () => {
    expect(getGrammarConceptAnchorId("grammar.concept.bare-noun")).toBe(
      "concept-bare-noun",
    );
    expect(
      getGrammarSourceAnchorId(
        "grammar.source.basisgrammatica-bohairisch-koptisch",
      ),
    ).toBe("source-basisgrammatica-bohairisch-koptisch");
  });

  it("preserves canonical concept and source order for lesson presentation", () => {
    const bundle = getGrammarLessonBundleBySlug("lesson-1");

    expect(bundle).not.toBeNull();

    const concepts = getOrderedLessonConcepts(bundle!);
    const sources = getOrderedLessonSources(bundle!);

    expect(concepts[0]?.id).toBe("grammar.concept.bare-noun");
    expect(concepts[concepts.length - 1]?.id).toBe(
      "grammar.concept.nomina-sacra",
    );
    expect(sources.map((source) => source.id)).toEqual([
      "grammar.source.basisgrammatica-bohairisch-koptisch",
    ]);
  });
});
