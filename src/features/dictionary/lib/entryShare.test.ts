import { describe, expect, it } from "vitest";
import type { LexicalEntry } from "@/features/dictionary/types";
import { buildEntrySharePayload } from "./entryShare";

function createEntry(
  overrides: Partial<LexicalEntry> & Pick<LexicalEntry, "id" | "headword">,
): LexicalEntry {
  const { id, headword, ...rest } = overrides;

  return {
    id,
    headword,
    dialects: {},
    pos: "N",
    gender: "",
    english_meanings: [],
    greek_equivalents: [],
    raw: {
      meaning: "",
      word: headword,
    },
    ...rest,
  };
}

describe("entry share helpers", () => {
  it("builds an English share payload with a short gloss and related forms", () => {
    const entry = createEntry({
      id: "cd_173",
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
        },
      },
      english_meanings: ["nn son"],
    });
    const parentEntry = createEntry({
      id: "cd_100",
      headword: "ⲥⲁϫ",
      english_meanings: ["root"],
    });
    const relatedEntries = [
      createEntry({
        id: "cd_174",
        headword: "ⲥⲁϫⲉ",
        english_meanings: ["daughter"],
      }),
      createEntry({
        id: "cd_175",
        headword: "ⲥⲁϫⲟ",
        english_meanings: ["speech"],
      }),
    ] as const;

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      parentEntry,
      relatedEntries,
      url: "https://kyrilloswannes.com/en/entry/cd_173",
    });

    expect(payload.title).toBe("ϭⲁϫⲓ ϭⲁϫ | Coptic Dictionary");
    expect(payload.text).toContain("Coptic dictionary entry: ϭⲁϫⲓ ϭⲁϫ");
    expect(payload.text).toContain("son.");
    expect(payload.text).toContain("Related forms: ⲥⲁϫ • ⲥⲁϫⲉ");
    expect(payload.text).not.toContain("ⲥⲁϫⲟ");
    expect(payload.copyText).toContain(
      "https://kyrilloswannes.com/en/entry/cd_173",
    );
  });

  it("builds a Dutch share payload with Dutch labels", () => {
    const entry = createEntry({
      id: "cd_200",
      headword: "ⲣⲱⲙⲉ",
      english_meanings: ["man"],
      dutch_meanings: ["mens"],
    });
    const relatedEntry = createEntry({
      id: "cd_201",
      headword: "ⲣⲱⲙⲉ",
      dialects: {
        B: {
          absolute: "ⲣⲱⲙⲓ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
      dutch_meanings: ["menselijk"],
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "nl",
      relatedEntries: [relatedEntry],
      url: "https://kyrilloswannes.com/nl/entry/cd_200",
    });

    expect(payload.title).toBe("ⲣⲱⲙⲉ | Koptisch woordenboek");
    expect(payload.text).toContain("Koptisch woordenboeklemma: ⲣⲱⲙⲉ");
    expect(payload.text).toContain("mens.");
    expect(payload.text).toContain("Verwante vormen: ⲣⲱⲙⲓ");
    expect(payload.copyText).toContain(
      "https://kyrilloswannes.com/nl/entry/cd_200",
    );
  });
});
