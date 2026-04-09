import { describe, expect, it } from "vitest";

import {
  buildLexicalEntryFromSourceRow,
  extractDialectsAndHeadword,
} from "./rawEntry";

describe("dictionary raw entry parsing", () => {
  it("captures Bohairic absolute variants without changing the primary headword", () => {
    const parsed = extractDialectsAndHeadword("(B) ϭⲱⲓⲥ, ⳪\n(S) ϫⲟⲉⲓⲥ");

    expect(parsed.headword).toBe("ϭⲱⲓⲥ");
    expect(parsed.dialects.B).toMatchObject({
      absolute: "ϭⲱⲓⲥ",
      absoluteVariants: ["⳪"],
    });
  });

  it("keeps the main Bohairic absolute form when related female lines are present", () => {
    const entry = buildLexicalEntryFromSourceRow(
      {
        word: ["(S, A, sA) ϣⲏⲣⲉ", "(B, F, O) ϣⲏⲣⲓ", "(B) female: ϣⲉⲣⲓ"].join(
          "\n",
        ),
        meaning: "m son [υιοσ]",
      },
      "cd_test",
    );

    expect(entry).toMatchObject({
      id: "cd_test",
      headword: "ϣⲏⲣⲉ",
      pos: "N",
      gender: "M",
      english_meanings: ["m son [υιοσ]"],
      greek_equivalents: ["υιοσ"],
    });
    expect(entry?.dialects.B).toMatchObject({
      absolute: "ϣⲏⲣⲓ",
    });
  });
});
