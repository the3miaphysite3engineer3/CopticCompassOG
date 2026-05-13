import { describe, expect, it } from "vitest";

import type {
  DictionaryMeaningGroupGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import { buildEntrySharePayload } from "./entryShare";

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

describe("entry share helpers", () => {
  it("builds an English share payload with a short gloss", () => {
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
    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/cd_173",
    });

    expect(payload.title).toBe("ϭⲁϫⲓ ϭⲁϫ | Coptic Dictionary");
    expect(payload.text).toContain("Coptic dictionary entry: ϭⲁϫⲓ ϭⲁϫ");
    expect(payload.text).toContain("son.");
    expect(payload.text).not.toContain("Related forms:");
    expect(payload.copyText).toContain(
      "https://www.copticcompass.com/en/entry/cd_173",
    );
  });

  it("builds a Dutch share payload with Dutch labels", () => {
    const entry = createEntry({
      id: "cd_200",
      headword: "ⲣⲱⲙⲉ",
      meaningGroups: [
        {
          grammar: { pos: "N" },
          dutch_meanings: ["mens"],
          english_meanings: ["man"],
        },
      ],
    });
    const payload = buildEntrySharePayload({
      entry,
      language: "nl",
      url: "https://www.copticcompass.com/nl/entry/cd_200",
    });

    expect(payload.title).toBe("ⲣⲱⲙⲉ | Koptisch woordenboek");
    expect(payload.text).toContain("Koptisch woordenboeklemma: ⲣⲱⲙⲉ");
    expect(payload.text).toContain("mens.");
    expect(payload.text).not.toContain("Verwante vormen:");
    expect(payload.copyText).toContain(
      "https://www.copticcompass.com/nl/entry/cd_200",
    );
  });

  it("shares gendered headings and all structured gendered gloss rows", () => {
    const entry = createEntry({
      id: "cd_550",
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      grammarGender: "M",
      genderedMeanings: [
        {
          english: {
            f: "female slave",
            m: "male slave",
            pl: "slaves",
          },
        },
        {
          english: {
            f: "female servant, maidservant",
            m: "male servant",
            pl: "servants",
          },
        },
      ],
      inflectedForms: [
        {
          kind: "feminine",
          dialect: "B",
          form: "ⲃⲱⲕⲓ",
        },
        {
          kind: "plural",
          dialect: "B",
          form: "ⲉⲃⲓⲁⲓⲕ",
        },
      ],
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/cd_550",
    });

    expect(payload.title).toBe("ⲃⲱⲕ m ⲃⲱⲕⲓ f ⲉⲃⲓⲁⲓⲕ pl | Coptic Dictionary");
    expect(payload.text).toContain(
      "Coptic dictionary entry: ⲃⲱⲕ m ⲃⲱⲕⲓ f ⲉⲃⲓⲁⲓⲕ pl",
    );
    expect(payload.text).toContain(
      "m male slave; f female slave; pl slaves; m male servant; f female servant, maidservant; pl servants.",
    );
    expect(payload.text).not.toContain("Related forms: ⲃⲱⲕⲓ");
  });

  it("includes the primary construct participle in share headings", () => {
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

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/cd_130",
    });

    expect(payload.title).toBe("ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~ | Coptic Dictionary");
    expect(payload.text).toContain(
      "Coptic dictionary entry: ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
  });
});
