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

  it("pages filtered results without building the full matched list", () => {
    const dictionary = [lordEntry, fatherEntry, runEntry];
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
      totalEntries: 3,
      totalMatches: 2,
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
      hasMore: false,
      nextOffset: null,
      totalMatches: 2,
    });
  });
});
