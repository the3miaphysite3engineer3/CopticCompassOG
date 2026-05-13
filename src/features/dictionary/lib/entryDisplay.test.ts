import { describe, expect, it } from "vitest";

import type {
  DictionaryMeaningGroupGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import {
  formatDialectForms,
  formatImperativeForms,
  getAllPluralForms,
  formatPrincipalDialectForms,
  getDialectImperativeForms,
  getDialectPluralForms,
  getDialectVariantRows,
  getGenderedDialectFormParts,
  getGenderedHeadingParts,
  getPreferredEntryDialectKey,
  getPreferredEntryDisplaySpelling,
  getPreferredEntryPrincipalSpelling,
} from "./entryDisplay";

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

describe("dictionary entry display helpers", () => {
  it("prefers Bohairic forms when the app default dialect is Bohairic", () => {
    const entry = createEntry({
      id: "cd_173",
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
          variants: {
            absolute: ["ϫⲁϫⲓ"],
          },
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
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ϭⲁϫⲓ ϭⲁϫ");
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

  it("does not prepend the headword when a dialect only has bound forms", () => {
    const entry = createEntry({
      id: "cd_361",
      headword: "ϩⲛ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⳳⲉⲛ-",
          pronominal: "ⲛⳳⲏⲧ=",
          stative: "",
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⳳⲉⲛ-/ⲛⳳⲏⲧ=",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⳳⲉⲛ-/ⲛⳳⲏⲧ=");
  });

  it("shows the Bohairic with entry as nominal plus pronominal bound forms", () => {
    const entry = createEntry({
      id: "cd_892",
      headword: "ⲙⲛ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⲛⲉⲙ-",
          pronominal: "ⲛⲉⲙⲁ=",
          stative: "",
        },
      },
      meaningGroups: [
        { grammar: { pos: "PREP" }, english_meanings: ["preposition, with"] },
      ],
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲛⲉⲙ-/ⲛⲉⲙⲁ=",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⲛⲉⲙ-/ⲛⲉⲙⲁ=");
  });

  it("shows the primary construct participle after verbal forms", () => {
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
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe(
      "ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
    expect(formatPrincipalDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ϭⲓ ϭⲓ-/ϭⲓⲧ=",
    );
  });

  it("collapses matching nominal and pronominal bound stems", () => {
    const entry = createEntry({
      id: "cd_bound_same",
      headword: "ⲙⲟϩ",
      dialects: {
        B: {
          absolute: "ⲙⲟϩ",
          nominal: "ⲙⲁϩ-",
          pronominal: "ⲙⲁϩ=",
          stative: "ⲙⲉϩ†",
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲙⲟϩ ⲙⲁϩ-/= ⲙⲉϩ†",
    );
  });

  it("keeps different nominal and pronominal bound stems separate", () => {
    const entry = createEntry({
      id: "cd_bound_different",
      headword: "ⲙⲛ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⲛⲉⲙ-",
          pronominal: "ⲛⲉⲙⲁ=",
          stative: "",
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲛⲉⲙ-/ⲛⲉⲙⲁ=",
    );
  });

  it("returns secondary construct participles for the variants section", () => {
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
    });

    expect(getDialectVariantRows(entry.dialects.B)).toEqual([
      {
        forms: ["ϭⲁⲩ~"],
        state: "constructParticiples",
      },
    ]);
  });

  it("returns imperative forms separately without adding them to the header", () => {
    const entry = createEntry({
      id: "cd_2",
      headword: "ϯ",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
      inflectedForms: [
        { kind: "imperative", dialect: "B", form: "ⲙⲟⲓ", role: "absolute" },
        { kind: "imperative", dialect: "B", form: "ⲙⲁ-", role: "nominal" },
        {
          kind: "imperative",
          dialect: "B",
          form: "ⲙⲏⲓ=",
          role: "pronominal",
        },
      ],
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ϯ ϯ-/ⲧⲏⲓ= ⲧⲟⲓ†",
    );
    expect(getDialectVariantRows(entry.dialects.B)).toEqual([]);
    expect(getDialectImperativeForms(entry, "B")).toEqual([
      "ⲙⲟⲓ",
      "ⲙⲁ-",
      "ⲙⲏⲓ=",
    ]);
    expect(formatImperativeForms(getDialectImperativeForms(entry, "B"))).toBe(
      "ⲙⲟⲓ ⲙⲁ-/ⲙⲏⲓ=",
    );
  });

  it("keeps non-canonical imperative lists comma-separated", () => {
    expect(formatImperativeForms(["ⲁⲣⲓ-", "ⲉⲣⲓ-"])).toBe("ⲁⲣⲓ-, ⲉⲣⲓ-");
  });

  it("uses absolute plus bound forms for principal spellings", () => {
    const baseEntry = createEntry({
      id: "cd_2",
      headword: "ϯ",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
    });
    const relatedEntry = createEntry({
      id: "cd_2b",
      headword: "ⲙⲟⲓ",
      dialects: {
        B: {
          absolute: "ⲙⲟⲓ",
          nominal: "ⲙⲁ-",
          pronominal: "ⲙⲏⲓ=",
          stative: "",
        },
      },
    });

    expect(getPreferredEntryPrincipalSpelling(baseEntry)).toBe("ϯ ϯ-/ⲧⲏⲓ=");
    expect(getPreferredEntryPrincipalSpelling(relatedEntry)).toBe(
      "ⲙⲟⲓ ⲙⲁ-/ⲙⲏⲓ=",
    );
  });

  it("builds gendered noun headings from structured feminine and plural forms", () => {
    const kingEntry = createEntry({
      id: "cd_18",
      headword: "ⲣⲣⲟ",
      dialects: {
        B: {
          absolute: "ⲟⲩⲣⲟ",
        },
      },
      grammarGender: "M",
      inflectedForms: [
        {
          kind: "plural",
          dialect: "B",
          form: "ⲟⲩⲣⲱⲟⲩ",
        },
        {
          kind: "feminine",
          dialect: "B",
          form: "ⲟⲩⲣⲱ",
        },
      ],
    });

    expect(getGenderedHeadingParts(kingEntry, "B")).toEqual([
      {
        entryId: "cd_18",
        marker: "m",
        spelling: "ⲟⲩⲣⲟ",
      },
      {
        marker: "f",
        spelling: "ⲟⲩⲣⲱ",
      },
      {
        marker: "pl",
        spelling: "ⲟⲩⲣⲱⲟⲩ",
      },
    ]);
  });

  it("keeps same-spelling masculine and feminine forms visible", () => {
    const masculineEntry = createEntry({
      id: "cd_same_m",
      headword: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      dialects: {
        B: {
          absolute: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
        },
      },
      grammarGender: "M",
      inflectedForms: [
        {
          kind: "feminine",
          dialect: "B",
          form: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
        },
      ],
    });

    expect(getGenderedHeadingParts(masculineEntry, "B")).toEqual([
      {
        entryId: "cd_same_m",
        marker: "m",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
      {
        marker: "f",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
    ]);
    expect(getGenderedDialectFormParts(masculineEntry, "B")).toEqual([
      {
        entryId: "cd_same_m",
        marker: "m",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
      {
        marker: "f",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
    ]);
  });

  it("builds exact-dialect gendered form rows without borrowing fallback forms", () => {
    const servantEntry = createEntry({
      id: "cd_550",
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
        F: {
          absolute: "ⲃⲱⲕ",
        },
      },
      grammarGender: "M",
      inflectedForms: [
        {
          kind: "plural",
          dialect: "B",
          form: "ⲉⲃⲓⲁⲓⲕ",
        },
        {
          kind: "feminine",
          dialect: "B",
          form: "ⲃⲱⲕⲓ",
        },
      ],
    });

    expect(getGenderedDialectFormParts(servantEntry, "B")).toEqual([
      {
        entryId: "cd_550",
        marker: "m",
        spelling: "ⲃⲱⲕ",
      },
      {
        marker: "f",
        spelling: "ⲃⲱⲕⲓ",
      },
      {
        marker: "pl",
        spelling: "ⲉⲃⲓⲁⲓⲕ",
      },
    ]);
    expect(getGenderedDialectFormParts(servantEntry, "F")).toEqual([]);
  });

  it("collects structured plural forms for display", () => {
    const entry = createEntry({
      id: "cd_plural_display",
      headword: "ⲁϩⲟ",
      inflectedForms: [
        {
          kind: "plural",
          dialect: "B",
          form: "ⲁϩⲱⲣ",
        },
        {
          kind: "plural",
          dialect: "S",
          form: "ⲁϩⲱⲱⲣ",
        },
        {
          kind: "plural",
          dialect: "S",
          form: "ⲉϩⲱⲣ",
        },
        {
          kind: "plural",
          dialect: "S",
          form: "ⲁϩⲱⲣⲉ",
        },
        {
          kind: "plural",
          form: "ⲁϩⲱⲣ",
        },
        {
          kind: "dual",
          dialect: "S",
          form: "ⲁϩⲟⲩⲉ",
        },
      ],
    });

    expect(getDialectPluralForms(entry, "S")).toEqual([
      "ⲁϩⲱⲱⲣ",
      "ⲉϩⲱⲣ",
      "ⲁϩⲱⲣⲉ",
    ]);
    expect(
      getDialectPluralForms(entry, "S", { includeUnscoped: true }),
    ).toEqual(["ⲁϩⲱⲱⲣ", "ⲉϩⲱⲣ", "ⲁϩⲱⲣⲉ", "ⲁϩⲱⲣ"]);
    expect(getAllPluralForms(entry)).toEqual([
      "ⲁϩⲱⲣ",
      "ⲁϩⲱⲱⲣ",
      "ⲉϩⲱⲣ",
      "ⲁϩⲱⲣⲉ",
    ]);
  });

  it("does not build gendered headings without structured feminine forms", () => {
    const servantEntry = createEntry({
      id: "cd_550",
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      grammarGender: "M",
      inflectedForms: [
        {
          kind: "plural",
          dialect: "B",
          form: "ⲉⲃⲓⲁⲓⲕ",
        },
      ],
    });

    expect(getGenderedHeadingParts(servantEntry, "B")).toEqual([]);
  });

  it("returns no variant rows without secondary forms", () => {
    const entry = createEntry({
      id: "cd_121",
      headword: "ϣⲱⲧ",
      dialects: {
        B: {
          absolute: "ϣⲱⲧ",
          nominal: "ϣⲉⲧ-",
          pronominal: "ϣⲁⲧ=",
          stative: "ϣⲁⲧ†",
          constructParticiples: ["ϣⲁⲧ~"],
        },
      },
    });

    expect(getDialectVariantRows(entry.dialects.B)).toEqual([]);
    expect(getDialectVariantRows(undefined)).toEqual([]);
  });

  it("orders dialect variants by grammatical state", () => {
    const entry = createEntry({
      id: "cd_variant",
      headword: "ⲕⲱ",
      dialects: {
        S: {
          absolute: "ⲕⲱ",
          nominal: "ⲕⲁ-",
          pronominal: "ⲕⲁ=",
          stative: "ⲕⲏ†",
          constructParticiples: ["ⲕⲁ~"],
          variants: {
            constructParticiples: ["ⲕⲉ~"],
            absolute: ["ⲕⲉ"],
            pronominal: ["ⲕⲉ="],
          },
        },
      },
    });

    expect(getDialectVariantRows(entry.dialects.S)).toEqual([
      {
        forms: ["ⲕⲉ"],
        state: "absolute",
      },
      {
        forms: ["ⲕⲉ="],
        state: "pronominal",
      },
      {
        forms: ["ⲕⲉ~"],
        state: "constructParticiples",
      },
    ]);
  });

  it("shows the Bohairic between entry as nominal plus pronominal bound forms", () => {
    const entry = createEntry({
      id: "cd_1713",
      headword: "ⲟⲩⲧⲉ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⲟⲩⲧⲉ-",
          pronominal: "ⲟⲩⲧⲱ=",
          stative: "",
        },
      },
      meaningGroups: [
        { grammar: { pos: "PREP" }, english_meanings: ["between, among"] },
      ],
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲟⲩⲧⲉ-/ⲟⲩⲧⲱ=",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⲟⲩⲧⲉ-/ⲟⲩⲧⲱ=");
  });
});
