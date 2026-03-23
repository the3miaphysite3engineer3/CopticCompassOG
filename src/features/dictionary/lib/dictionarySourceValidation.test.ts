import { describe, expect, it } from "vitest";
import type { LexicalEntry } from "@/features/dictionary/types";
import { validateDictionarySourceConfig } from "./dictionarySourceValidation";

function createSourceEntry(
  id: string,
  headword: string,
  meaning: string,
  rawWord: string,
): LexicalEntry {
  return {
    id,
    headword,
    dialects: {
      B: {
        absolute: headword,
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    pos: "N",
    gender: "M",
    english_meanings: [meaning],
    greek_equivalents: [],
    raw: {
      word: rawWord,
      meaning,
    },
  };
}

const validSourceDictionary: LexicalEntry[] = [
  createSourceEntry("cd_173", "ⲥⲟⲛ", "brother", "(B) ⲥⲟⲛ"),
  createSourceEntry("cd_493", "ⲁⲛⲟⲕ", "1 sg", "(B) ⲁⲛⲟⲕ"),
  createSourceEntry("cd_63", "ϧⲉⲗⲗⲟ", "old person", "(B) ϧⲉⲗⲗⲟ\n(B) female: ϧⲉⲗⲗⲱ"),
  createSourceEntry("cd_18", "ⲟⲩⲣⲟ", "king", "(B) ⲟⲩⲣⲟ\n(B) female: ⲟⲩⲣⲱ"),
  createSourceEntry("cd_20", "ϣⲏⲣⲓ", "son", "(B) ϣⲏⲣⲓ\n(B) female: ϣⲉⲣⲓ"),
  createSourceEntry("cd_132", "ϣⲫⲏⲣ", "friend", "(B) ϣⲫⲏⲣ\n(B) female: ϣⲫⲉⲣⲓ"),
  createSourceEntry("cd_176", "ⲃⲉⲗⲗⲉ", "blind person", "(B) ⲃⲉⲗⲗⲉ\n(B) female: ⲃⲉⲗⲗⲏ"),
  createSourceEntry("cd_550", "ⲃⲱⲕ", "servant", "(B) ⲃⲱⲕ\n(B) female: ⲃⲱⲕⲓ"),
  createSourceEntry("cd_1048", "ⲙⲛⲟⲧ", "porter", "(B) ⲙⲛⲟⲧ\n(B) female: ⲉⲙⲛⲟⲧⲉ"),
  createSourceEntry("cd_1298", "ⲣⲙϩⲉ", "free person", "(B) ⲣⲉⲙϩⲉ\n(S, B) female: ⲣⲙⲛϩⲏ"),
  createSourceEntry("cd_2268", "ϩⲑⲟ", "horse", "(B) ϩⲑⲟ\n(B) female: (ⲉ)ϩⲑⲟⲣⲓ"),
];

describe("dictionary source validation", () => {
  it("accepts a complete matching source dictionary", () => {
    expect(validateDictionarySourceConfig(validSourceDictionary)).toMatchObject({
      sourceEntries: 11,
      curatedDefinitions: 3,
      promotedDefinitions: 9,
    });
  });

  it("rejects promoted definitions that no longer match the source data", () => {
    const invalidDictionary = validSourceDictionary.map((entry) =>
      entry.id === "cd_20"
        ? {
            ...entry,
            raw: {
              ...entry.raw,
              word: "(B) ϣⲏⲣⲓ",
            },
          }
        : entry,
    );

    expect(() => validateDictionarySourceConfig(invalidDictionary)).toThrow(
      'Promoted related entry "cd_20a" does not match any source candidate on parent "cd_20"',
    );
  });
});
