import { describe, expect, it } from "vitest";

import {
  prepareDictionaryForSearch,
  searchPreparedDictionary,
  searchPreparedDictionaryPage,
} from "./search";

import type { DictionaryClientEntry } from "./types";

const lordEntry: DictionaryClientEntry = {
  id: "cd_17",
  headword: "ϭⲱⲓⲥ",
  etymology: "Egy",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      nominal: "",
      pronominal: "",
      stative: "",
      variants: {
        absolute: ["⳪"],
      },
    },
  },
  meaningGroups: [{ grammar: { pos: "N" }, english_meanings: ["lord"] }],
  greek_equivalents: ["κυριοσ"],
};

const fatherEntry: DictionaryClientEntry = {
  id: "cd_18",
  headword: "ⲉⲓⲱⲧ",
  etymology: "Egy",
  dialects: {
    B: {
      absolute: "ⲉⲓⲱⲧ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  meaningGroups: [
    { grammar: { gender: "M", pos: "N" }, english_meanings: ["father"] },
  ],
  greek_equivalents: [],
};

const elderEntry: DictionaryClientEntry = {
  id: "cd_63a",
  headword: "ⳳⲉⲗⲗⲱ",
  etymology: "Egy",
  dialects: {
    B: {
      absolute: "ⳳⲉⲗⲗⲱ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  meaningGroups: [{ grammar: { pos: "N" }, english_meanings: ["elder"] }],
  greek_equivalents: [],
};

const prepositionEntry: DictionaryClientEntry = {
  id: "cd_946",
  headword: "ⲛ-",
  etymology: "Egy",
  dialects: {
    B: {
      absolute: "",
      nominal: "ⲛ̀-",
      pronominal: "ⲙ̀ⲙⲟ=",
      stative: "",
    },
  },
  meaningGroups: [{ grammar: { pos: "PREP" }, english_meanings: ["with, by"] }],
  greek_equivalents: [],
};

const runEntry: DictionaryClientEntry = {
  id: "cd_19",
  headword: "ⲃⲱⲕ",
  etymology: "Egy",
  dialects: {
    S: {
      absolute: "ⲃⲱⲕ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  meaningGroups: [{ grammar: { pos: "V" }, english_meanings: ["run"] }],
  greek_equivalents: [],
};

const takeEntry: DictionaryClientEntry = {
  id: "cd_130",
  headword: "ϫⲓ",
  etymology: "Egy",
  dialects: {
    B: {
      absolute: "ϭⲓ",
      nominal: "ϭⲓ-",
      pronominal: "ϭⲓⲧ=",
      stative: "ϭⲏⲟⲩ†",
      constructParticiples: ["ϭⲁⲓ~"],
      constructParticipleCompounds: [
        {
          form: "ϭⲁⲩⲙⲱⲓⲧ",
          sourceConstructParticiple: "ϭⲁⲩ~",
          gender: "BOTH",
          english_meanings: ["guide, leader"],
          dutch_meanings: ["gids, leider"],
        },
      ],
      variants: {
        constructParticiples: ["ϭⲁⲩ~"],
      },
    },
  },
  meaningGroups: [{ grammar: { pos: "V" }, english_meanings: ["take"] }],
  greek_equivalents: [],
};

const accentedParticipleEntry: DictionaryClientEntry = {
  id: "cd_130",
  headword: "ϫⲓ",
  etymology: "Egy",
  dialects: {
    S: {
      absolute: "ϫⲓ",
      nominal: "ϫⲓ-",
      pronominal: "ϫⲓⲧ=",
      stative: "ϫⲏⲩ†",
      constructParticiples: ["ϫⲁⲓ̈~"],
      variants: {
        constructParticiples: ["ϫⲁⲩ~"],
      },
    },
  },
  meaningGroups: [{ grammar: { pos: "V" }, english_meanings: ["take"] }],
  greek_equivalents: [],
};

describe("dictionary search", () => {
  it("indexes absolute Bohairic variants alongside the main spelling", () => {
    const preparedDictionary = prepareDictionaryForSearch([lordEntry]);

    expect(
      searchPreparedDictionary("ϭⲱⲓⲥ", preparedDictionary, [lordEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_17"]);
    expect(
      searchPreparedDictionary("⳪", preparedDictionary, [lordEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_17"]);
  });

  it("matches khei variants as the same search character", () => {
    const preparedDictionary = prepareDictionaryForSearch([elderEntry]);

    expect(
      searchPreparedDictionary("\u03e7ⲉⲗⲗⲱ", preparedDictionary, [
        elderEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_63a"]);
    expect(
      searchPreparedDictionary("ⳳⲉⲗⲗⲱ", preparedDictionary, [elderEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_63a"]);
    expect(
      searchPreparedDictionary("\u03e6ⲈⲖⲖⲰ", preparedDictionary, [
        elderEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_63a"]);
    expect(
      searchPreparedDictionary("ⳲⲈⲖⲖⲰ", preparedDictionary, [elderEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_63a"]);
    expect(
      searchPreparedDictionary(
        "ⳲⲈⲖⲖⲰ",
        preparedDictionary,
        [elderEntry],
        true,
      ).map((entry) => entry.id),
    ).toEqual(["cd_63a"]);
  });

  it("treats jinkim-marked and unmarked bound forms as equivalent", () => {
    const preparedDictionary = prepareDictionaryForSearch([prepositionEntry]);

    expect(
      searchPreparedDictionary("ⲙ̀ⲙⲟ=", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_946"]);
    expect(
      searchPreparedDictionary("ⲙⲙⲟ=", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_946"]);
    expect(
      searchPreparedDictionary("ⲛ̀-", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_946"]);
    expect(
      searchPreparedDictionary("ⲛ-", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_946"]);
  });

  it("indexes primary and variant construct participles", () => {
    const preparedDictionary = prepareDictionaryForSearch([takeEntry]);

    expect(
      searchPreparedDictionary("ϭⲁⲓ", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_130"]);
    expect(
      searchPreparedDictionary("ϭⲁⲓ~", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_130"]);
    expect(
      searchPreparedDictionary("ϭⲁⲩ", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_130"]);
  });

  it("indexes construct participle compound forms and meanings", () => {
    const preparedDictionary = prepareDictionaryForSearch([takeEntry]);

    expect(
      searchPreparedDictionary("ϭⲁⲩⲙⲱⲓⲧ", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_130"]);
    expect(
      searchPreparedDictionary("leader", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_130"]);
    expect(
      searchPreparedDictionary("leider", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_130"]);
  });

  it("indexes grouped meanings", () => {
    const groupedOnlyEntry: DictionaryClientEntry = {
      id: "cd_grouped_only",
      headword: "ϯ",
      etymology: "Egy",
      dialects: {
        B: {
          absolute: "ϯ",
        },
      },
      meaningGroups: [
        {
          grammar: { pos: "V", valency: "TR" },
          dutch_meanings: ["geven"],
          english_meanings: ["give"],
        },
      ],
    };
    const preparedDictionary = prepareDictionaryForSearch([groupedOnlyEntry]);

    expect(
      searchPreparedDictionary("give", preparedDictionary, [
        groupedOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_grouped_only"]);
    expect(
      searchPreparedDictionary("geven", preparedDictionary, [
        groupedOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_grouped_only"]);
  });

  it("matches accented construct participles with unaccented queries", () => {
    const preparedDictionary = prepareDictionaryForSearch([
      accentedParticipleEntry,
    ]);

    expect(
      searchPreparedDictionary("ϫⲁⲓ", preparedDictionary, [
        accentedParticipleEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_130"]);
    expect(
      searchPreparedDictionary("ϫⲁⲓ̈~", preparedDictionary, [
        accentedParticipleEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_130"]);
  });

  it("pages filtered results without building the full matched list", () => {
    const dictionary = [lordEntry, fatherEntry, elderEntry, runEntry];
    const preparedDictionary = prepareDictionaryForSearch(dictionary);

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 1,
        offset: 0,
        preparedDictionary,
        query: "",
        selectedDialect: "B",
        selectedPartOfSpeech: "N",
      }),
    ).toMatchObject({
      entries: [{ id: "cd_17" }],
      hasMore: true,
      nextOffset: 1,
      totalEntries: 4,
      totalMatches: 3,
    });

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 1,
        offset: 1,
        preparedDictionary,
        query: "",
        selectedDialect: "B",
        selectedPartOfSpeech: "N",
      }),
    ).toMatchObject({
      entries: [{ id: "cd_18" }],
      hasMore: true,
      nextOffset: 2,
      totalMatches: 3,
    });
  });

  it("filters by every structured meaning-group grammar value", () => {
    const adjectivalNounEntry: DictionaryClientEntry = {
      id: "cd_adjectival_noun",
      headword: "ⲉⲛⲉϩ",
      etymology: "Egy",
      dialects: {
        B: {
          absolute: "ⲉⲛⲉϩ",
        },
      },
      meaningGroups: [
        {
          grammar: {
            pos: "N",
            gender: "M",
          },
          english_meanings: ["eternity"],
        },
        {
          grammar: {
            pos: "ADJ",
          },
          english_meanings: ["eternal"],
        },
      ],
    };
    const dictionary = [adjectivalNounEntry, runEntry];
    const preparedDictionary = prepareDictionaryForSearch(dictionary);

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 10,
        offset: 0,
        preparedDictionary,
        query: "",
        selectedDialect: "ALL",
        selectedPartOfSpeech: "ADJ",
      }),
    ).toMatchObject({
      entries: [{ id: "cd_adjectival_noun" }],
      totalMatches: 1,
    });
  });

  it("matches entries by structured plural inflected forms", () => {
    const treasureEntry: DictionaryClientEntry = {
      id: "cd_7",
      headword: "ⲁϩⲟ",
      etymology: "Egy",
      dialects: {
        S: {
          absolute: "ⲁϩⲟ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
      meaningGroups: [
        { grammar: { pos: "N" }, english_meanings: ["treasure"] },
      ],
      greek_equivalents: ["θησαυροσ"],
      inflectedForms: [
        { kind: "plural", dialect: "S", form: "ⲁϩⲱⲱⲣ" },
        { kind: "plural", dialect: "A", form: "ⲉϩⲱⲣ" },
        { kind: "plural", dialect: "B", form: "ⲁϩⲱⲣ" },
      ],
    };

    const preparedDictionary = prepareDictionaryForSearch([treasureEntry]);

    expect(
      searchPreparedDictionary("ⲁϩⲱⲱⲣ", preparedDictionary, [
        treasureEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_7"]);

    expect(
      searchPreparedDictionary("ⲉϩⲱⲣ", preparedDictionary, [treasureEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_7"]);

    expect(
      searchPreparedDictionary("ⲁϩⲱⲣ", preparedDictionary, [treasureEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_7"]);
  });

  it("matches entries by structured inflected forms", () => {
    const pluralOnlyEntry: DictionaryClientEntry = {
      id: "cd_plural_only",
      headword: "ϩⲁϩ",
      etymology: "Egy",
      dialects: {},
      meaningGroups: [
        { grammar: { pos: "N" }, english_meanings: ["many, much"] },
      ],
      greek_equivalents: [],
      inflectedForms: [
        {
          kind: "plural",
          dialect: "S",
          form: "ϩⲁϩ",
        },
        {
          kind: "feminine",
          dialect: "B",
          form: "ⳳⲁϩⲓ",
        },
      ],
    };

    const preparedDictionary = prepareDictionaryForSearch([pluralOnlyEntry]);

    expect(
      searchPreparedDictionary("ϩⲁϩ", preparedDictionary, [
        pluralOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_plural_only"]);
    expect(
      searchPreparedDictionary("ⳳⲁϩⲓ", preparedDictionary, [
        pluralOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_plural_only"]);
    expect(
      searchPreparedDictionary(
        "ⳳⲁϩⲓ",
        preparedDictionary,
        [pluralOnlyEntry],
        true,
      ).map((entry) => entry.id),
    ).toEqual(["cd_plural_only"]);
  });

  it("matches dialect filters by structured inflected dialect coverage", () => {
    const structuredPluralEntry: DictionaryClientEntry = {
      id: "cd_structured_plural",
      headword: "ϩⲁϩ",
      etymology: "Egy",
      dialects: {},
      meaningGroups: [
        { grammar: { pos: "N" }, english_meanings: ["many, much"] },
      ],
      greek_equivalents: [],
      inflectedForms: [
        {
          kind: "plural",
          dialect: "S",
          form: "ϩⲁϩ",
        },
      ],
    };
    const dictionary = [structuredPluralEntry, lordEntry];
    const preparedDictionary = prepareDictionaryForSearch(dictionary);

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 10,
        preparedDictionary,
        selectedDialect: "S",
      }).entries.map((entry) => entry.id),
    ).toEqual(["cd_structured_plural"]);
  });

  it("matches base entries by structured feminine and plural forms", () => {
    const servantEntry: DictionaryClientEntry = {
      id: "cd_550",
      headword: "ⲃⲱⲕ",
      etymology: "Egy",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      meaningGroups: [
        {
          grammar: { gender: "M", pos: "N" },
          english_meanings: ["servant, slave"],
        },
      ],
      greek_equivalents: [],
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
    };

    const preparedDictionary = prepareDictionaryForSearch([servantEntry]);

    expect(
      searchPreparedDictionary("ⲃⲱⲕⲓ", preparedDictionary, [servantEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_550"]);
    expect(
      searchPreparedDictionary("ⲉⲃⲓⲁⲓⲕ", preparedDictionary, [
        servantEntry,
      ]).map((entry) => entry.id),
    ).toEqual(["cd_550"]);
  });

  it("matches entries by their imperative forms", () => {
    const giveEntry: DictionaryClientEntry = {
      id: "cd_2",
      headword: "ϯ",
      etymology: "Egy",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
      meaningGroups: [{ grammar: { pos: "V" }, english_meanings: ["give"] }],
      greek_equivalents: ["διδοναι"],
      inflectedForms: [
        { kind: "imperative", dialect: "B", form: "ⲙⲟⲓ", role: "absolute" },
      ],
    };

    const preparedDictionary = prepareDictionaryForSearch([giveEntry]);

    expect(
      searchPreparedDictionary("ⲙⲟⲓ", preparedDictionary, [giveEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["cd_2"]);
  });
});
