import { describe, expect, it } from "vitest";
import type { LexicalEntry } from "@/features/dictionary/types";
import { getBohairicFemaleAuditItems } from "./relatedEntryAudit";

describe("related entry audit", () => {
  it("marks promoted and pending Bohairic female candidates separately", () => {
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
        greek_equivalents: [],
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
        greek_equivalents: [],
        raw: {
          word: "(B) female: ϣⲉⲣⲓ",
          meaning: "son",
        },
      },
    ];

    expect(getBohairicFemaleAuditItems(dictionary)).toEqual([
      {
        parentEntryId: "cd_18",
        parentHeadword: "ⲣⲣⲟ",
        form: "ⲟⲩⲣⲱ",
        rawLine: "(B) female: ⲟⲩⲣⲱ",
        status: "promoted",
        promotedEntryId: "cd_18a",
      },
      {
        parentEntryId: "cd_20",
        parentHeadword: "ϣⲏⲣⲉ",
        form: "ϣⲉⲣⲓ",
        rawLine: "(B) female: ϣⲉⲣⲓ",
        status: "promoted",
        promotedEntryId: "cd_20a",
      },
    ]);
  });
});
