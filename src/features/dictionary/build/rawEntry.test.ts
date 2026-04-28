import { describe, expect, it } from "vitest";

import {
  buildLexicalEntryFromSourceRow,
  extractDialectsAndHeadword,
  normalizeConstructParticipleAbbreviation,
  normalizeMeaningDialectSigla,
  normalizeMeaningPunctuation,
} from "./rawEntry";

describe("dictionary raw entry parsing", () => {
  it("captures Bohairic absolute variants without changing the primary headword", () => {
    const parsed = extractDialectsAndHeadword("(B) ϭⲱⲓⲥ, ⳪\n(S) ϫⲟⲉⲓⲥ");

    expect(parsed.headword).toBe("ϭⲱⲓⲥ");
    expect(parsed.dialects.B).toMatchObject({
      absolute: "ϭⲱⲓⲥ",
      variants: {
        absolute: ["⳪"],
      },
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

  it("classifies interjections with the compact INJ code", () => {
    const entry = buildLexicalEntryFromSourceRow(
      {
        word: "(B) ⲭⲉⲣⲉ",
        meaning: "interj, greetings, hail",
      },
      "cd_test_interj",
    );

    expect(entry?.pos).toBe("INJ");
  });

  it("parses construct participle lines as tilde-marked forms", () => {
    expect(
      normalizeConstructParticipleAbbreviation("p c ⲧⲁⲓ-\np.c., giver\npc S"),
    ).toBe("pc ⲧⲁⲓ-\npc, giver\npc S");

    const entry = buildLexicalEntryFromSourceRow(
      {
        word: "(S) p c  (?) ⲧⲁⲡ-, ⲧⲁϥ-",
        meaning: "p.c. (?), thrower",
      },
      "cd_test_pc",
    );

    expect(entry?.headword).toBe("ⲧⲁⲡ~");
    expect(entry?.dialects.S?.nominal).toBe("");
    expect(entry?.dialects.S?.constructParticiples).toEqual(["ⲧⲁⲡ~"]);
    expect(entry?.dialects.S?.variants?.constructParticiples).toEqual(["ⲧⲁϥ~"]);
    expect(entry?.english_meanings).toEqual(["pc (?) thrower"]);
    expect(entry?.raw).toMatchObject({
      word: "(S) ⲧⲁⲡ~, ⲧⲁϥ~",
      meaning: "pc (?) thrower",
    });
  });

  it("compacts dialect sigla lists in meaning glosses", () => {
    expect(
      normalizeMeaningDialectSigla(
        "pc S,A,L,B,F,O, carrier\ntr: S,A,sA,B,F\nmostly f S,Sa,F, m B",
      ),
    ).toBe("pc ABFLOS, carrier\ntr: ABFLS\nmostly f FSSa, m B");

    const entry = buildLexicalEntryFromSourceRow(
      {
        word: "(S) ⲣⲁ",
        meaning: "pc S,A,sA,B,F, doer",
      },
      "cd_test_dialect_sigla",
    );

    expect(entry?.english_meanings).toEqual(["pc ABFLS doer"]);
    expect(entry?.raw.meaning).toBe("pc ABFLS doer");
  });

  it("removes punctuation after grammar labels and dialect sigla", () => {
    expect(
      normalizeMeaningPunctuation(
        "intr: S, peel off\ntr (refl): B, rest\npc ABFLOS, carrier\npc (?), thrower",
      ),
    ).toBe(
      "intr S peel off\ntr (refl) B rest\npc ABFLOS carrier\npc (?) thrower",
    );
  });

  it("keeps same-state form alternatives as dialect-specific variants", () => {
    const parsed = extractDialectsAndHeadword(
      "(S) ⲕⲱ\n(S) ⲕⲁ-, ⲕⲉ-\n(S) ⲕⲁ=, ⲕⲉ=\n(S) ⲕⲏ+, ⲕⲉ+",
    );

    expect(parsed.dialects.S).toMatchObject({
      absolute: "ⲕⲱ",
      nominal: "ⲕⲁ-",
      pronominal: "ⲕⲁ=",
      stative: "ⲕⲏ†",
      variants: {
        nominal: ["ⲕⲉ-"],
        pronominal: ["ⲕⲉ="],
        stative: ["ⲕⲉ†"],
      },
    });
  });

  it("does not treat construct participle example notes as variants", () => {
    const parsed = extractDialectsAndHeadword("(B) pc ⲛⲁ- {ⲛⲁϩⲏⲧ~, ⲛⲁⲏⲧ}~");

    expect(parsed.dialects.B).toMatchObject({
      constructParticiples: ["ⲛⲁ~"],
    });
    expect(parsed.dialects.B?.variants?.constructParticiples).toBeUndefined();
  });
});
