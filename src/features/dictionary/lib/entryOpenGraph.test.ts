import { describe, expect, it } from "vitest";

import type {
  DictionaryMeaningGroupGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import {
  buildEntryOpenGraphImageUrl,
  buildEntryOpenGraphPreview,
} from "./entryOpenGraph";

type TestEntryOverrides = Partial<LexicalEntry> &
  Pick<LexicalEntry, "id" | "headword"> & {
    grammarGender?: DictionaryMeaningGroupGrammarGender;
  };

function createEntry(overrides: TestEntryOverrides): LexicalEntry {
  const { grammarGender, id, headword, ...rest } = overrides;
  const meaningGroups = rest.meaningGroups ?? [
    {
      grammar: grammarGender
        ? { gender: grammarGender, pos: "N" }
        : { pos: "N" },
    },
  ];

  return {
    id,
    headword,
    dialects: {},
    etymology: "Egy",
    greek_equivalents: [],
    ...rest,
    meaningGroups,
  };
}

describe("entry Open Graph helpers", () => {
  it("builds a stable entry-specific Open Graph image URL", () => {
    expect(
      buildEntryOpenGraphImageUrl("cd_173", "nl", "https://example.com"),
    ).toBe("https://example.com/api/og?type=entry&locale=nl&id=cd_173");
  });

  it("builds a preview with gloss", () => {
    const entry = createEntry({
      id: "cd_173",
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
        },
      },
      meaningGroups: [{ grammar: { pos: "N" }, english_meanings: ["N son"] }],
    });

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ϭⲁϫⲓ ϭⲁϫ");
    expect(preview.gloss).toBe("son");
    expect(preview.strapline).toBe("Coptic Dictionary");
  });

  it("uses gendered heading and gloss data for social previews", () => {
    const entry = createEntry({
      id: "cd_18",
      headword: "ⲣⲣⲟ",
      dialects: {
        B: {
          absolute: "ⲟⲩⲣⲟ",
        },
      },
      meaningGroups: [
        { grammar: { gender: "M", pos: "N" } },
        { grammar: { pos: "ADJ" }, english_meanings: ["royal"] },
      ],
      grammarGender: "M",
      genderedMeanings: [
        {
          english: {
            f: "queen",
            m: "king",
            pl: "royals",
          },
        },
      ],
      inflectedForms: [
        {
          kind: "feminine",
          dialect: "B",
          form: "ⲟⲩⲣⲱ",
        },
        {
          kind: "plural",
          dialect: "B",
          form: "ⲟⲩⲣⲱⲟⲩ",
        },
      ],
    });

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ⲟⲩⲣⲟ m ⲟⲩⲣⲱ f ⲟⲩⲣⲱⲟⲩ pl");
    expect(preview.headingParts).toEqual([
      { marker: "m", spelling: "ⲟⲩⲣⲟ" },
      { marker: "f", spelling: "ⲟⲩⲣⲱ" },
      { marker: "pl", spelling: "ⲟⲩⲣⲱⲟⲩ" },
    ]);
    expect(preview.gloss).toBe("m king; f queen; pl royals");
    expect(preview.genderedGlossRows).toEqual([
      {
        values: [
          { marker: "m", meaning: "king" },
          { marker: "f", meaning: "queen" },
          { marker: "pl", meaning: "royals" },
        ],
      },
    ]);
  });

  it("includes the primary construct participle in preview headings", () => {
    const entry = createEntry({
      id: "cd_130",
      headword: "ϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲓ",
          nominal: "ϭⲓ-",
          pronominal: "ϭⲓⲧ=",
          stative: "ϭⲏⲟⲩ†",
          constructParticiples: ["ϭⲁⲓ~"],
          variants: {
            constructParticiples: ["ϭⲁⲩ~"],
          },
        },
      },
      meaningGroups: [
        { grammar: { form: "PC", pos: "V" }, english_meanings: ["pc taker"] },
      ],
    });

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~");
  });
});
