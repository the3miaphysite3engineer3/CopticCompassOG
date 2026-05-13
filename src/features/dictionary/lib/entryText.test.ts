import { describe, expect, it } from "vitest";

import {
  buildEntryDescription,
  getLocalizedGenderedMeanings,
  getLocalizedMeaningGroups,
  getLocalizedMeaningValues,
} from "@/features/dictionary/lib/entryText";
import type { LexicalEntry } from "@/features/dictionary/types";

const fallbackEntry: LexicalEntry = {
  id: "cd_test",
  headword: "ϭⲱⲓⲥ",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  meaningGroups: [{ grammar: { pos: "N" } }],
  etymology: "Egy",
  greek_equivalents: [],
};

describe("entry descriptions", () => {
  it("falls back to product-first wording in English", () => {
    expect(buildEntryDescription(fallbackEntry, "en")).toBe(
      "ϭⲱⲓⲥ (Noun) in the Coptic dictionary on Coptic Compass.",
    );
  });

  it("falls back to product-first wording in Dutch", () => {
    expect(buildEntryDescription(fallbackEntry, "nl")).toBe(
      "ϭⲱⲓⲥ (Zelfstandig naamwoord) in het Koptische woordenboek van Coptic Compass.",
    );
  });

  it("accepts metadata-specific display headings and summaries", () => {
    expect(
      buildEntryDescription(fallbackEntry, "en", {
        displayHeadword: "ⲟⲩⲣⲟ m ⲟⲩⲣⲱ f ⲟⲩⲣⲱⲟⲩ pl",
        summary: "m king; f queen; pl royals",
      }),
    ).toBe(
      "ⲟⲩⲣⲟ m ⲟⲩⲣⲱ f ⲟⲩⲣⲱⲟⲩ pl (Noun) in the Coptic dictionary. m king; f queen; pl royals.",
    );
  });
});

describe("localized meaning groups", () => {
  const groupedVerbEntry: Pick<
    LexicalEntry,
    "dialectMeanings" | "meaningGroups"
  > = {
    dialectMeanings: [],
    meaningGroups: [
      {
        grammar: { pos: "V", valency: "INTR" },
        english_meanings: ["intransitive meaning"],
      },
      {
        grammar: { pos: "V", valency: "TR" },
        english_meanings: ["transitive meaning"],
      },
      {
        grammar: { form: "STA", pos: "V" },
        english_meanings: ["stative meaning"],
      },
      {
        grammar: { mood: "IMP", pos: "V" },
        english_meanings: ["imperative meaning"],
      },
      {
        grammar: { form: "PC", pos: "V" },
        english_meanings: ["construct participle meaning"],
      },
    ],
  };

  it("hides form-dependent groups when the active dialect lacks that form", () => {
    expect(
      getLocalizedMeaningGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
        hasImperativeForms: true,
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA", "IMP"]);
  });

  it("keeps construct-participle groups when the active dialect has them", () => {
    expect(
      getLocalizedMeaningGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          constructParticiples: ["ⲧⲁⲓ~"],
          stative: "ⲧⲁⲓ†",
        },
        hasImperativeForms: true,
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA", "IMP", "PC"]);
  });

  it("omits compact source sigla notes from meaning group labels", () => {
    expect(
      getLocalizedMeaningGroups(
        {
          ...groupedVerbEntry,
          meaningGroups: [
            {
              grammar: { form: "PC", pos: "V" },
              english_meanings: ["receiver"],
              english_notes: ["BL"],
            },
          ],
        },
        "en",
        {
          dialectForms: {
            absolute: "ϣⲱⲡ",
            constructParticiples: ["ϣⲁⲡ~"],
          },
        },
      ),
    ).toEqual([
      {
        code: "PC",
        meanings: ["receiver"],
        notes: [],
      },
    ]);
  });

  it("keeps descriptive notes in meaning group labels", () => {
    expect(
      getLocalizedMeaningGroups({
        ...groupedVerbEntry,
        meaningGroups: [
          {
            grammar: { pos: "V", valency: "INTR" },
            english_meanings: ["be valid"],
            english_notes: ["B only"],
          },
        ],
      }),
    ).toEqual([
      {
        code: "INTR",
        meanings: ["be valid"],
        notes: ["B only"],
      },
    ]);
  });

  it("attaches structured gendered rows to the noun meaning group", () => {
    expect(
      getLocalizedMeaningGroups({
        dialectMeanings: [],
        genderedMeanings: [
          {
            english: {
              f: "queen",
              m: "king",
              pl: "royals",
            },
          },
        ],
        meaningGroups: [
          { grammar: { gender: "M", pos: "N" } },
          { grammar: { pos: "ADJ" }, english_meanings: ["royal"] },
        ],
      }),
    ).toEqual([
      {
        code: "N",
        genderedRows: [
          {
            values: [
              { marker: "m", meaning: "king" },
              { marker: "f", meaning: "queen" },
              { marker: "pl", meaning: "royals" },
            ],
          },
        ],
        meanings: [],
        notes: [],
      },
      {
        code: "ADJ",
        meanings: ["royal"],
        notes: [],
      },
    ]);
  });

  it("hides imperative groups when the active dialect lacks structured imperatives", () => {
    expect(
      getLocalizedMeaningGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
        hasImperativeForms: false,
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA"]);
  });

  it("uses meaning groups as the primary gloss source", () => {
    const groupedOnlyEntry: Pick<LexicalEntry, "meaningGroups"> = {
      meaningGroups: [
        {
          grammar: { pos: "V", valency: "TR" },
          dutch_meanings: ["geven"],
          english_meanings: ["give"],
        },
      ],
    };

    expect(getLocalizedMeaningValues(groupedOnlyEntry, "en")).toEqual(["give"]);
    expect(getLocalizedMeaningValues(groupedOnlyEntry, "nl")).toEqual([
      "geven",
    ]);
  });
});

describe("localized gendered meanings", () => {
  const genderedEntry: Pick<
    LexicalEntry,
    "dialectMeanings" | "genderedMeanings" | "meaningGroups"
  > = {
    dialectMeanings: [],
    genderedMeanings: [
      {
        dutch: {
          f: "vrouwelijke slaaf",
          m: "mannelijke slaaf",
          pl: "slaven",
        },
        english: {
          f: "female slave",
          m: "male slave",
          pl: "slaves",
        },
      },
    ],
    meaningGroups: [],
  };

  it("localizes gendered meaning rows without display numbering", () => {
    expect(getLocalizedGenderedMeanings(genderedEntry, "en")).toEqual([
      {
        values: [
          { marker: "m", meaning: "male slave" },
          { marker: "f", meaning: "female slave" },
          { marker: "pl", meaning: "slaves" },
        ],
      },
    ]);
  });

  it("keeps structured gendered rows first in flat meaning values", () => {
    expect(getLocalizedMeaningValues(genderedEntry, "en")[0]).toBe(
      "male slave; female slave; slaves",
    );
  });
});
