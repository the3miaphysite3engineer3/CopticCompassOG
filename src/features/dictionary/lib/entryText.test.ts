import { describe, expect, it } from "vitest";

import { buildEntryDescription } from "@/features/dictionary/lib/entryText";
import type { LexicalEntry } from "@/features/dictionary/types";

const fallbackEntry: LexicalEntry = {
  id: "cd_test",
  headword: "ϭⲱⲓⲥ",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      absoluteVariants: [],
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "N",
  gender: "",
  english_meanings: [""],
  greek_equivalents: [],
  raw: {
    word: "ϭⲱⲓⲥ",
    meaning: "",
  },
};

describe("entry descriptions", () => {
  it("falls back to product-first wording in English", () => {
    expect(buildEntryDescription(fallbackEntry, "en")).toBe(
      "ϭⲱⲓⲥ (N) in the Coptic dictionary on Coptic Compass.",
    );
  });

  it("falls back to product-first wording in Dutch", () => {
    expect(buildEntryDescription(fallbackEntry, "nl")).toBe(
      "ϭⲱⲓⲥ (N) in het Koptische woordenboek van Coptic Compass.",
    );
  });
});
