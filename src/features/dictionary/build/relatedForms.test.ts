import { describe, expect, it } from "vitest";
import { extractRelatedFormCandidates } from "./relatedForms";

describe("extractRelatedFormCandidates", () => {
  it("extracts Bohairic female candidates from raw source lines", () => {
    const candidates = extractRelatedFormCandidates({
      id: "cd_20",
      headword: "ϣⲏⲣⲉ",
      raw: {
        word: ["(S, A, sA) ϣⲏⲣⲉ", "(B, F, O) ϣⲏⲣⲓ", "(B) female: ϣⲉⲣⲓ"].join(
          "\n",
        ),
        meaning: "m son [υιοσ]",
      },
    });

    expect(candidates).toContainEqual({
      parentEntryId: "cd_20",
      parentHeadword: "ϣⲏⲣⲉ",
      relationLabel: "female",
      dialect: "B",
      form: "ϣⲉⲣⲓ",
      rawLine: "(B) female: ϣⲉⲣⲓ",
    });
  });

  it("strips source html before parsing related form lines", () => {
    const candidates = extractRelatedFormCandidates({
      id: "cd_20",
      headword: "ϣⲏⲣⲉ",
      raw: {
        word: "(B) <i>female: </i>ϣⲉⲣⲓ",
        meaning: "zoon",
      },
    });

    expect(candidates).toEqual([
      {
        parentEntryId: "cd_20",
        parentHeadword: "ϣⲏⲣⲉ",
        relationLabel: "female",
        dialect: "B",
        form: "ϣⲉⲣⲓ",
        rawLine: "(B) female: ϣⲉⲣⲓ",
      },
    ]);
  });
});
