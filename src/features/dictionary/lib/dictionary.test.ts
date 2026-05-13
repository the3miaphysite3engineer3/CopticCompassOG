import { describe, expect, it } from "vitest";

import type {
  DictionaryMeaningGroupGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import {
  getDictionaryEntryById,
  listDictionaryEntryIds,
  toDictionaryClientEntry,
} from "./dictionary";

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
    dialects: {
      B: {
        absolute: headword,
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    etymology: "Egy",
    greek_equivalents: [],
    ...rest,
    meaningGroups,
  };
}

describe("dictionary helpers", () => {
  const dictionary = [
    createEntry({
      id: "cd_20",
      headword: "ϣⲏⲣⲓ",
      meaningGroups: [{ grammar: { pos: "N" }, english_meanings: ["son"] }],
      inflectedForms: [
        {
          kind: "feminine",
          dialect: "B",
          form: "ϣⲉⲣⲓ",
        },
      ],
    }),
    createEntry({
      id: "cd_493",
      headword: "ⲁⲛⲟⲕ",
      meaningGroups: [{ grammar: { pos: "OTHER" }, english_meanings: ["I"] }],
    }),
    createEntry({
      id: "cd_493a",
      headword: "ⲛⲑⲟⲥ",
      meaningGroups: [
        { grammar: { pos: "OTHER" }, english_meanings: ["she, it"] },
      ],
    }),
    createEntry({
      id: "cd_493b",
      headword: "ⲛⲑⲱⲟⲩ",
      meaningGroups: [
        { grammar: { pos: "OTHER" }, english_meanings: ["they"] },
      ],
    }),
  ];

  it("resolves an entry by id from an injected dictionary", () => {
    expect(getDictionaryEntryById("cd_20", dictionary)?.headword).toBe("ϣⲏⲣⲓ");
    expect(getDictionaryEntryById("missing", dictionary)).toBeNull();
  });

  it("returns the stable ordered list of entry ids for sitemap and params use", () => {
    expect(listDictionaryEntryIds(dictionary)).toEqual([
      "cd_20",
      "cd_493",
      "cd_493a",
      "cd_493b",
    ]);
  });

  it("builds a reduced client payload with only client-facing dictionary fields", () => {
    const clientEntry = toDictionaryClientEntry(dictionary[0]!);

    expect(clientEntry).toMatchObject({
      id: "cd_20",
      headword: "ϣⲏⲣⲓ",
      meaningGroups: [{ english_meanings: ["son"] }],
    });
    expect(Object.keys(clientEntry).sort()).toEqual(
      [
        "dialectMeanings",
        "dialects",
        "etymology",
        "genderedMeanings",
        "headword",
        "id",
        "inflectedForms",
        "meaningGroups",
      ].sort(),
    );
  });

  it("keeps structured inflected forms in the reduced client payload for search", () => {
    const pluralOnlyEntry = createEntry({
      id: "cd_plural_only",
      headword: "ϩⲁϩ",
      dialects: {},
      meaningGroups: [
        { grammar: { pos: "N" }, english_meanings: ["many, much"] },
      ],
      inflectedForms: [
        {
          kind: "plural",
          dialect: "S",
          form: "ϩⲁϩ",
          uncertain: false,
        },
      ],
    });

    expect(
      getDictionaryEntryById("cd_plural_only", [pluralOnlyEntry]),
    ).toMatchObject({
      id: "cd_plural_only",
      inflectedForms: [{ kind: "plural", dialect: "S", form: "ϩⲁϩ" }],
    });
    expect(toDictionaryClientEntry(pluralOnlyEntry)).toMatchObject({
      id: "cd_plural_only",
      inflectedForms: [{ kind: "plural", dialect: "S", form: "ϩⲁϩ" }],
    });
  });
});
