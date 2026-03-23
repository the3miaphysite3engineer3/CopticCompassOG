import { describe, expect, it } from "vitest";
import { applyDerivedDictionaryEntries, getDerivedDictionaryEntries } from "./derivedEntries";
import type { LexicalEntry } from "@/features/dictionary/types";

function createSourceEntry(
  id: string,
  headword: string,
  meaning: string,
  rawWord: string,
  greekEquivalents?: string[],
): LexicalEntry {
  const meaningLines = meaning
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    id,
    headword,
    dialects: {
      B: {
        absolute: headword,
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    pos: "N",
    gender: "M",
    english_meanings: meaningLines,
    greek_equivalents:
      greekEquivalents ??
      Array.from(
        new Set(
          meaningLines.flatMap((line) =>
            Array.from(line.matchAll(/\[(.*?)\]/g), (match) => match[1].trim()),
          ),
        ),
      ),
    raw: {
      word: rawWord,
      meaning,
    },
  };
}

describe("derived dictionary entries", () => {
  it("materializes curated Bohairic subentries with stable parent linkage", () => {
    const derivedEntry = getDerivedDictionaryEntries("en").find(
      (entry) => entry.id === "cd_173a",
    );
    const pronounEntry = getDerivedDictionaryEntries("en").find(
      (entry) => entry.id === "cd_493a",
    );

    expect(derivedEntry).toMatchObject({
      id: "cd_173a",
      headword: "ⲥⲱⲛⲓ",
      parentEntryId: "cd_173",
      relationType: "feminine-counterpart",
      gender: "F",
      english_meanings: ["sister"],
    });
    expect(pronounEntry).toMatchObject({
      id: "cd_493a",
      headword: "ⲛⲑⲟⲥ",
      parentEntryId: "cd_493",
      relationType: "paradigm-member",
      english_meanings: ["she, it"],
    });
  });

  it("appends derived entries without duplicating existing ids", () => {
    const sourceDictionary = [
      createSourceEntry("cd_173", "ⲥⲟⲛ", "brother", "(B) ⲥⲟⲛ"),
      createSourceEntry("cd_493", "ⲁⲛⲟⲕ", "1 sg", "(B) ⲁⲛⲟⲕ"),
      createSourceEntry(
        "cd_63",
        "ϧⲉⲗⲗⲟ",
        "old person",
        "(B) ϧⲉⲗⲗⲟ\n(B) female: ϧⲉⲗⲗⲱ",
      ),
      createSourceEntry(
        "cd_18",
        "ⲟⲩⲣⲟ",
        "king",
        "(B) ⲟⲩⲣⲟ\n(B) female: ⲟⲩⲣⲱ",
      ),
      createSourceEntry(
        "cd_20",
        "ϣⲏⲣⲓ",
        "son",
        "(B) ϣⲏⲣⲓ\n(B) female: ϣⲉⲣⲓ",
      ),
      createSourceEntry(
        "cd_132",
        "ϣⲫⲏⲣ",
        "friend",
        "(B) ϣⲫⲏⲣ\n(B) female: ϣⲫⲉⲣⲓ",
      ),
      createSourceEntry(
        "cd_176",
        "ⲃⲉⲗⲗⲉ",
        "blind person",
        "(B) ⲃⲉⲗⲗⲉ\n(B) female: ⲃⲉⲗⲗⲏ",
      ),
      createSourceEntry(
        "cd_550",
        "ⲃⲱⲕ",
        "servant",
        "(B) ⲃⲱⲕ\n(B) female: ⲃⲱⲕⲓ",
      ),
      createSourceEntry(
        "cd_1048",
        "ⲙⲛⲟⲧ",
        "porter",
        "(B) ⲙⲛⲟⲧ\n(B) female: ⲉⲙⲛⲟⲧⲉ",
      ),
      createSourceEntry(
        "cd_1298",
        "ⲣⲙϩⲉ",
        "free person",
        "(B) ⲣⲉⲙϩⲉ\n(S, B) female: ⲣⲙⲛϩⲏ",
      ),
      createSourceEntry(
        "cd_2268",
        "ϩⲑⲟ",
        "horse",
        "(B) ϩⲑⲟ\n(B) female: (ⲉ)ϩⲑⲟⲣⲓ",
      ),
    ];

    const enrichedDictionary = applyDerivedDictionaryEntries(sourceDictionary, "en");
    const ids = enrichedDictionary.map((entry) => entry.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "cd_173",
        "cd_493",
        "cd_18",
        "cd_20",
        "cd_132",
        "cd_550",
        "cd_1048",
        "cd_173a",
        "cd_493a",
        "cd_493b",
        "cd_63a",
        "cd_18a",
        "cd_20a",
        "cd_132a",
        "cd_176a",
        "cd_550a",
        "cd_1048a",
        "cd_1298a",
        "cd_2268a",
      ]),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("strips promoted feminine gloss lines from base entries while keeping the derived entry", () => {
    const sourceDictionary = [
      createSourceEntry("cd_173", "ⲥⲟⲛ", "brother", "(B) ⲥⲟⲛ"),
      createSourceEntry("cd_493", "ⲁⲛⲟⲕ", "1 sg", "(B) ⲁⲛⲟⲕ"),
      createSourceEntry(
        "cd_63",
        "ϧⲉⲗⲗⲟ",
        "old person",
        "(B) ϧⲉⲗⲗⲟ\n(B) female: ϧⲉⲗⲗⲱ",
      ),
      createSourceEntry(
        "cd_18",
        "ⲟⲩⲣⲟ",
        "king",
        "(B) ⲟⲩⲣⲟ\n(B) female: ⲟⲩⲣⲱ",
      ),
      createSourceEntry(
        "cd_20",
        "ϣⲏⲣⲓ",
        "son, child [υιοσ, τεκνον]\ndaughter [θυγατηρ]",
        "(B) ϣⲏⲣⲓ\n(B) female: ϣⲉⲣⲓ",
      ),
      createSourceEntry(
        "cd_132",
        "ϣⲫⲏⲣ",
        "friend",
        "(B) ϣⲫⲏⲣ\n(B) female: ϣⲫⲉⲣⲓ",
      ),
      createSourceEntry(
        "cd_176",
        "ⲃⲉⲗⲗⲉ",
        "blind person",
        "(B) ⲃⲉⲗⲗⲉ\n(B) female: ⲃⲉⲗⲗⲏ",
      ),
      createSourceEntry(
        "cd_550",
        "ⲃⲱⲕ",
        "servant",
        "(B) ⲃⲱⲕ\n(B) female: ⲃⲱⲕⲓ",
      ),
      createSourceEntry(
        "cd_1048",
        "ⲙⲛⲟⲧ",
        "porter",
        "(B) ⲙⲛⲟⲧ\n(B) female: ⲉⲙⲛⲟⲧⲉ",
      ),
      createSourceEntry(
        "cd_1298",
        "ⲣⲙϩⲉ",
        "free person",
        "(B) ⲣⲉⲙϩⲉ\n(S, B) female: ⲣⲙⲛϩⲏ",
      ),
      createSourceEntry(
        "cd_2268",
        "ϩⲑⲟ",
        "horse [ιπποσ]\nf, mare [ιπποσ, φοροσ]",
        "(B) ϩⲑⲟ\n(B) female: (ⲉ)ϩⲑⲟⲣⲓ",
      ),
    ];

    const enrichedDictionary = applyDerivedDictionaryEntries(sourceDictionary, "en");
    const enrichedDutchDictionary = applyDerivedDictionaryEntries(
      [
        createSourceEntry("cd_173", "ⲥⲟⲛ", "broer", "(B) ⲥⲟⲛ"),
        createSourceEntry("cd_493", "ⲁⲛⲟⲕ", "1 sg", "(B) ⲁⲛⲟⲕ"),
        createSourceEntry(
          "cd_63",
          "ϧⲉⲗⲗⲟ",
          "oude persoon",
          "(B) ϧⲉⲗⲗⲟ\n(B) female: ϧⲉⲗⲗⲱ",
        ),
        createSourceEntry(
          "cd_18",
          "ⲟⲩⲣⲟ",
          "koning",
          "(B) ⲟⲩⲣⲟ\n(B) female: ⲟⲩⲣⲱ",
        ),
        createSourceEntry(
          "cd_20",
          "ϣⲏⲣⲓ",
          "zoon, kind\ndochter",
          "(B) ϣⲏⲣⲓ\n(B) female: ϣⲉⲣⲓ",
          ["υιοσ, τεκνον", "θυγατηρ"],
        ),
        createSourceEntry(
          "cd_132",
          "ϣⲫⲏⲣ",
          "vriend",
          "(B) ϣⲫⲏⲣ\n(B) female: ϣⲫⲉⲣⲓ",
        ),
        createSourceEntry(
          "cd_176",
          "ⲃⲉⲗⲗⲉ",
          "blinde persoon",
          "(B) ⲃⲉⲗⲗⲉ\n(B) female: ⲃⲉⲗⲗⲏ",
        ),
        createSourceEntry(
          "cd_550",
          "ⲃⲱⲕ",
          "dienaar",
          "(B) ⲃⲱⲕ\n(B) female: ⲃⲱⲕⲓ",
        ),
        createSourceEntry(
          "cd_1048",
          "ⲙⲛⲟⲧ",
          "portier",
          "(B) ⲙⲛⲟⲧ\n(B) female: ⲉⲙⲛⲟⲧⲉ",
        ),
        createSourceEntry(
          "cd_1298",
          "ⲣⲙϩⲉ",
          "vrije persoon",
          "(B) ⲣⲉⲙϩⲉ\n(S, B) female: ⲣⲙⲛϩⲏ",
        ),
        createSourceEntry(
          "cd_2268",
          "ϩⲑⲟ",
          "paard\nf, merrie",
          "(B) ϩⲑⲟ\n(B) female: (ⲉ)ϩⲑⲟⲣⲓ",
          ["ιπποσ", "ιπποσ, φοροσ"],
        ),
      ],
      "nl",
    );
    const sonEntry = enrichedDictionary.find((entry) => entry.id === "cd_20");
    const daughterEntry = enrichedDictionary.find((entry) => entry.id === "cd_20a");
    const horseEntry = enrichedDictionary.find((entry) => entry.id === "cd_2268");
    const mareEntry = enrichedDictionary.find((entry) => entry.id === "cd_2268a");
    const dutchSonEntry = enrichedDutchDictionary.find((entry) => entry.id === "cd_20");
    const dutchHorseEntry = enrichedDutchDictionary.find((entry) => entry.id === "cd_2268");

    expect(sonEntry?.english_meanings).toEqual(["son, child [υιοσ, τεκνον]"]);
    expect(sonEntry?.greek_equivalents).toEqual(["υιοσ, τεκνον"]);
    expect(daughterEntry?.english_meanings).toEqual(["daughter"]);

    expect(horseEntry?.english_meanings).toEqual(["horse [ιπποσ]"]);
    expect(horseEntry?.greek_equivalents).toEqual(["ιπποσ"]);
    expect(mareEntry?.english_meanings).toEqual(["mare"]);
    expect(dutchSonEntry?.english_meanings).toEqual(["zoon, kind"]);
    expect(dutchHorseEntry?.english_meanings).toEqual(["paard"]);
    expect(dutchSonEntry?.greek_equivalents).toEqual(["υιοσ, τεκνον"]);
    expect(dutchHorseEntry?.greek_equivalents).toEqual(["ιπποσ"]);
  });
});
