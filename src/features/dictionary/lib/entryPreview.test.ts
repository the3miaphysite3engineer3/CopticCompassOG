import { describe, expect, it } from "vitest";

import { buildEntryPreview } from "@/features/dictionary/lib/entryPreview";
import type { LexicalEntry } from "@/features/dictionary/types";

describe("entry preview metadata", () => {
  it("builds one shared gendered heading, gloss, and description", () => {
    const entry: LexicalEntry = {
      id: 550,
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      etym: "Egy",
      genderedMeanings: [
        {
          meanings: {
            en: {
              f: "female slave",
              m: "male slave",
              pl: "slaves",
            },
          },
        },
      ],
      inflections: {
        feminine: {
          B: {
            default: ["ⲃⲱⲕⲓ"],
          },
        },
        plural: {
          B: {
            default: ["ⲉⲃⲓⲁⲓⲕ"],
          },
        },
      },
      senses: [{ grammar: { gender: "M", pos: "N" } }],
    };

    const preview = buildEntryPreview({ entry, language: "en" });

    expect(preview.heading).toBe("ⲃⲱⲕ m ⲃⲱⲕⲓ f ⲉⲃⲓⲁⲓⲕ pl");
    expect(preview.headingParts).toEqual([
      { marker: "m", spelling: "ⲃⲱⲕ" },
      { marker: "f", spelling: "ⲃⲱⲕⲓ" },
      { marker: "pl", spelling: "ⲉⲃⲓⲁⲓⲕ" },
    ]);
    expect(preview.gloss).toBe("m male slave; f female slave; pl slaves");
    expect(preview.partOfSpeechLabel).toBe("Noun");
    expect(preview.description).toBe(
      "ⲃⲱⲕ m ⲃⲱⲕⲓ f ⲉⲃⲓⲁⲓⲕ pl (Noun) in the Coptic dictionary. m male slave; f female slave; pl slaves.",
    );
  });

  it("localizes gloss and part-of-speech metadata", () => {
    const entry: LexicalEntry = {
      id: 200,
      headword: "ⲣⲱⲙⲉ",
      dialects: {
        B: {
          absolute: "ⲣⲱⲙⲓ",
        },
      },
      etym: "Egy",
      senses: [
        {
          grammar: { pos: "N" },
          meanings: { en: ["man"], nl: ["mens"] },
        },
      ],
    };

    const preview = buildEntryPreview({ entry, language: "nl" });

    expect(preview.heading).toBe("ⲣⲱⲙⲓ");
    expect(preview.gloss).toBe("mens");
    expect(preview.partOfSpeechLabel).toBe("Zelfstandig naamwoord");
    expect(preview.description).toBe(
      "ⲣⲱⲙⲓ (Zelfstandig naamwoord) in het Koptische woordenboek. mens.",
    );
  });
});
