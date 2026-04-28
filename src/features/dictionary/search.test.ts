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
  pos: "N",
  gender: "",
  english_meanings: ["lord"],
  greek_equivalents: ["κυριοσ"],
};

const fatherEntry: DictionaryClientEntry = {
  id: "cd_18",
  headword: "ⲉⲓⲱⲧ",
  dialects: {
    B: {
      absolute: "ⲉⲓⲱⲧ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "N",
  gender: "M",
  english_meanings: ["father"],
  greek_equivalents: [],
};

const elderEntry: DictionaryClientEntry = {
  id: "cd_63a",
  headword: "ⳳⲉⲗⲗⲱ",
  dialects: {
    B: {
      absolute: "ⳳⲉⲗⲗⲱ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "N",
  gender: "",
  english_meanings: ["elder"],
  greek_equivalents: [],
};

const prepositionEntry: DictionaryClientEntry = {
  id: "cd_946",
  headword: "ⲛ-",
  dialects: {
    B: {
      absolute: "",
      nominal: "ⲛ̀-",
      pronominal: "ⲙ̀ⲙⲟ=",
      stative: "",
    },
  },
  pos: "PREP",
  gender: "",
  english_meanings: ["with, by"],
  greek_equivalents: [],
};

const runEntry: DictionaryClientEntry = {
  id: "cd_19",
  headword: "ⲃⲱⲕ",
  dialects: {
    S: {
      absolute: "ⲃⲱⲕ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "V",
  gender: "",
  english_meanings: ["run"],
  greek_equivalents: [],
};

const takeEntry: DictionaryClientEntry = {
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
  pos: "V",
  gender: "",
  english_meanings: ["take"],
  greek_equivalents: [],
};

const accentedParticipleEntry: DictionaryClientEntry = {
  id: "cd_130",
  headword: "ϫⲓ",
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
  pos: "V",
  gender: "",
  english_meanings: ["take"],
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
});
