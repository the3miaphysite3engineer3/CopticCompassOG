import { describe, expect, it } from "vitest";
import type { LexicalEntry } from "@/features/dictionary/types";
import { createDefinedTermStructuredData } from "./structuredData";

const lordEntry: LexicalEntry = {
  id: "cd_17",
  headword: "ϭⲱⲓⲥ",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      absoluteVariants: ["⳪"],
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "N",
  gender: "",
  english_meanings: ["lord"],
  greek_equivalents: ["κυριοσ"],
  raw: {
    word: "(B) ϭⲱⲓⲥ, ⳪",
    meaning: "lord",
  },
};

describe("structured dictionary data", () => {
  it("includes dialect variants in alternate labels without breaking serialization", () => {
    const data = createDefinedTermStructuredData(lordEntry);

    expect(data).toMatchObject({
      "@type": "DefinedTerm",
      name: "ϭⲱⲓⲥ",
      alternateName: ["ϭⲱⲓⲥ", "⳪"],
    });
  });
});
