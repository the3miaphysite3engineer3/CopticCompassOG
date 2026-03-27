import { describe, expect, it } from "vitest";
import type { LexicalEntry } from "@/features/dictionary/types";
import {
  getPreferredEntryDialectKey,
  getPreferredEntryDisplaySpelling,
} from "./entryDisplay";

function createEntry(
  overrides: Partial<LexicalEntry> & Pick<LexicalEntry, "id" | "headword">,
): LexicalEntry {
  const { id, headword, ...rest } = overrides;

  return {
    id,
    headword,
    dialects: {},
    pos: "N",
    gender: "",
    english_meanings: [],
    greek_equivalents: [],
    raw: {
      meaning: "",
      word: headword,
    },
    ...rest,
  };
}

describe("dictionary entry display helpers", () => {
  it("prefers Bohairic forms when the app default dialect is Bohairic", () => {
    const entry = createEntry({
      id: "cd_173",
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          absoluteVariants: ["ϫⲁϫⲓ"],
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
        },
        S: {
          absolute: "ⲥⲁϫⲓ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
    });

    expect(getPreferredEntryDialectKey(entry)).toBe("B");
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ϭⲁϫⲓ, ϫⲁϫⲓ ϭⲁϫ");
  });

  it("falls back to Sahidic when Bohairic is unavailable", () => {
    const entry = createEntry({
      id: "cd_174",
      headword: "ⲥⲁϫⲓ",
      dialects: {
        S: {
          absolute: "ⲥⲁϫⲓ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
    });

    expect(getPreferredEntryDialectKey(entry)).toBe("S");
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⲥⲁϫⲓ");
  });
});
