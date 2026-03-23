import { describe, expect, it } from "vitest";
import { getPromotedRelatedEntries } from "./promotedRelatedEntries";
import type { LexicalEntry } from "@/features/dictionary/types";

describe("promoted related dictionary entries", () => {
  it("promotes configured Bohairic female forms from source lines", () => {
    const dictionary: LexicalEntry[] = [
      {
        id: "cd_18",
        headword: "ⲣⲣⲟ",
        dialects: {
          B: {
            absolute: "ⲟⲩⲣⲟ",
            nominal: "",
            pronominal: "",
            stative: "",
          },
        },
        pos: "N",
        gender: "M",
        english_meanings: ["king"],
        greek_equivalents: ["βασιλευσ"],
        raw: {
          word: "(B) female: ⲟⲩⲣⲱ",
          meaning: "king",
        },
      },
      {
        id: "cd_20",
        headword: "ϣⲏⲣⲉ",
        dialects: {
          B: {
            absolute: "ϣⲏⲣⲓ",
            nominal: "",
            pronominal: "",
            stative: "",
          },
        },
        pos: "N",
        gender: "M",
        english_meanings: ["son"],
        greek_equivalents: ["υιοσ"],
        raw: {
          word: [
            "(S, A, sA) ϣⲏⲣⲉ",
            "(B, F, O) ϣⲏⲣⲓ",
            "(B) female: ϣⲉⲣⲓ",
          ].join("\n"),
          meaning: "m son [υιοσ]",
        },
      },
    ];

    expect(getPromotedRelatedEntries(dictionary, "en")).toEqual([
      expect.objectContaining({
        id: "cd_18a",
        headword: "ⲟⲩⲣⲱ",
        parentEntryId: "cd_18",
        relationType: "feminine-counterpart",
        gender: "F",
        english_meanings: ["queen"],
      }),
      expect.objectContaining({
        id: "cd_20a",
        headword: "ϣⲉⲣⲓ",
        parentEntryId: "cd_20",
        relationType: "feminine-counterpart",
        gender: "F",
        english_meanings: ["daughter"],
      }),
    ]);
  });
});
