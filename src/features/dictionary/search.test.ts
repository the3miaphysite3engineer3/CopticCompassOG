import { describe, expect, it } from "vitest";
import { prepareDictionaryForSearch, searchPreparedDictionary } from "./search";
import type { LexicalEntry } from "./types";

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

describe("dictionary search", () => {
  it("indexes absolute Bohairic variants alongside the main spelling", () => {
    const preparedDictionary = prepareDictionaryForSearch([lordEntry]);

    expect(searchPreparedDictionary("ϭⲱⲓⲥ", preparedDictionary).map((entry) => entry.id)).toEqual([
      "cd_17",
    ]);
    expect(searchPreparedDictionary("⳪", preparedDictionary).map((entry) => entry.id)).toEqual([
      "cd_17",
    ]);
  });
});
