import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { DialectForms, LexicalEntry } from "@/features/dictionary/types";

function hasUppercaseCopticCharacter(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    const isCoptic =
      codePoint !== undefined &&
      ((codePoint >= 0x2c80 && codePoint <= 0x2cff) ||
        (codePoint >= 0x03e2 && codePoint <= 0x03ef));

    if (isCoptic && character !== character.toLowerCase()) {
      return true;
    }
  }

  return false;
}

function collectDictionaryStrings(value: unknown, results: string[] = []) {
  if (typeof value === "string") {
    results.push(value);
    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectDictionaryStrings(item, results));
    return results;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) =>
      collectDictionaryStrings(item, results),
    );
  }

  return results;
}

function collectConstructParticiples(forms: DialectForms | undefined) {
  return [
    ...(forms?.constructParticiples ?? []),
    ...(forms?.variants?.constructParticiples ?? []),
  ];
}

function collectMeaningGlosses(entry: LexicalEntry) {
  return [
    ...(entry.english_meanings ?? []),
    ...(entry.dutch_meanings ?? []),
    entry.raw?.meaning ?? "",
    ...(entry.bohairicParadigmData?.englishMeanings ?? []),
    ...(entry.bohairicParadigmData?.dutchMeanings ?? []),
  ];
}

describe("dictionary dataset guardrails", () => {
  it("keeps modern lowercase Coptic spellings in the checked-in dictionary snapshot", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionaryJson = fs.readFileSync(filePath, "utf8");

    expect(dictionaryJson).not.toMatch(/"absoluteVariants"/);
    expect(dictionaryJson).not.toMatch(/[\u03e6\u03e7]/u);
    expect(dictionaryJson).toMatch(/[Ⳳⳳ]/u);
    expect(hasUppercaseCopticCharacter(dictionaryJson)).toBe(false);
  });

  it("keeps remaining construct participle gloss labels normalized as pc", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    const dictionaryStrings = collectDictionaryStrings(dictionary);

    expect(dictionaryStrings.some((value) => /\bpc\b/u.test(value))).toBe(true);
    expect(
      dictionaryStrings.filter((value) =>
        /\bp\s+c\b\.?|\bp\s*\.\s*c\b\.?|\bpc\./iu.test(value),
      ),
    ).toEqual([]);
  });

  it("stores construct participles as tilde-marked forms outside nominal state", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const invalidConstructParticiples: Array<{
      dialect: string;
      form: string;
      id: string;
    }> = [];
    const secondaryCanonicalConstructParticiples: Array<{
      dialect: string;
      forms: string[];
      id: string;
    }> = [];
    const nominalConstructParticiples: Array<{
      dialect: string;
      form: string;
      id: string;
    }> = [];

    for (const entry of dictionary) {
      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        if (/^pc\b/iu.test(forms.nominal)) {
          nominalConstructParticiples.push({
            dialect,
            form: forms.nominal,
            id: entry.id,
          });
        }

        if ((forms.constructParticiples?.length ?? 0) > 1) {
          secondaryCanonicalConstructParticiples.push({
            dialect,
            forms: forms.constructParticiples ?? [],
            id: entry.id,
          });
        }

        for (const form of collectConstructParticiples(forms)) {
          if (!form.endsWith("~") || /\s/.test(form)) {
            invalidConstructParticiples.push({
              dialect,
              form,
              id: entry.id,
            });
          }
        }
      }
    }

    expect(nominalConstructParticiples).toEqual([]);
    expect(secondaryCanonicalConstructParticiples).toEqual([]);
    expect(invalidConstructParticiples).toEqual([]);
    expect(
      dictionary.find((entry) => entry.id === "cd_130")?.dialects.B,
    ).toMatchObject({
      constructParticiples: ["ϭⲁⲓ~"],
      nominal: "ϭⲓ-",
      pronominal: "ϭⲓⲧ=",
      stative: "ϭⲏⲟⲩ†",
      variants: {
        constructParticiples: ["ϭⲁⲩ~"],
      },
    });
  });

  it("preserves source accents on Sahidic and Bohairic construct participles", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];

    expect(
      dictionary.find((entry) => entry.id === "cd_130")?.dialects.S
        ?.constructParticiples,
    ).toContain("ϫⲁⲓ̈~");
    expect(
      dictionary.find((entry) => entry.id === "cd_452")?.dialects.B
        ?.constructParticiples,
    ).toContain("ⲁ̀ϣ~");
    expect(
      dictionary.find((entry) => entry.id === "cd_2598")?.dialects.B
        ?.constructParticiples,
    ).toContain("ϭⲁⲧⲡ̄~");
  });

  it("includes source-supplied construct participles that were missing locally", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];

    expect(
      collectConstructParticiples(
        dictionary.find((entry) => entry.id === "cd_23")?.dialects.S,
      ),
    ).toContain("ⲣⲁ~");
    expect(
      collectConstructParticiples(
        dictionary.find((entry) => entry.id === "cd_138")?.dialects.B,
      ),
    ).toContain("ⲭⲁ~");
    expect(
      collectConstructParticiples(
        dictionary.find((entry) => entry.id === "cd_46")?.dialects.S,
      ),
    ).toContain("ϣⲛ̄~");
  });

  it("keeps construct participle glosses readable in English and Dutch", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];

    expect(
      dictionary.find((entry) => entry.id === "cd_133")?.english_meanings,
    ).toContain("pc ABFLOS carrier");
    expect(
      dictionary.find((entry) => entry.id === "cd_276")?.dutch_meanings,
    ).toContain("pc L onderzoeker, toetser");
    expect(
      dictionary.find((entry) => entry.id === "cd_2807")?.dutch_meanings,
    ).toContain("pc (?) kaal aan de voorkant van het hoofd");
  });

  it("compacts comma-separated dialect sigla lists in meaning glosses", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const commaSeparatedDialectSigla =
      /\b(?:Fb|Sa|Sf|Sl|sA|NH|A|B|F|L|O|S)(?:\s*,\s*(?:Fb|Sa|Sf|Sl|sA|NH|A|B|F|L|O|S))+\b/u;

    expect(
      dictionary
        .flatMap((entry) => collectMeaningGlosses(entry))
        .filter((value) => commaSeparatedDialectSigla.test(value)),
    ).toEqual([]);
  });

  it("omits grammar label punctuation and trailing dialect sigla commas in meaning glosses", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const grammarLabelPunctuation =
      /\b(?:pc|impers vb|imperative|adjective|auxil|intr|qual|conj|prep|advb|adj|adv|tr|refl|suff|pref|vb|nn|pron|art|int\.?)(?:\s*\([^)]*\))?[:,][ \t]*/iu;
    const trailingDialectSiglaComma = /\b(?:Fb|Sa|Sf|Sl|A|B|F|L|O|S)+,[ \t]+/u;

    expect(
      dictionary
        .flatMap((entry) => collectMeaningGlosses(entry))
        .filter(
          (value) =>
            grammarLabelPunctuation.test(value) ||
            trailingDialectSiglaComma.test(value),
        ),
    ).toEqual([]);
  });

  it("stores the ϩⲛ-/ⳳⲉⲛ- preposition entry as bound-only nominal and pronominal forms", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const entry = dictionary.find((candidate) => candidate.id === "cd_361");

    expect(entry).toBeDefined();
    expect(entry?.dialects.S).toMatchObject({
      absolute: "",
      nominal: "ϩⲛ-",
      pronominal: "ⲛϩⲏⲧ=",
    });
    expect(entry?.dialects.A).toMatchObject({
      absolute: "",
      nominal: "ⳉⲛ-",
      pronominal: "ⲛⳉⲏⲧ=",
    });
    expect(entry?.dialects.B).toMatchObject({
      absolute: "",
      nominal: "ⳳⲉⲛ-",
      pronominal: "ⲛ̀ⳳⲏⲧ=",
    });
  });

  it("tags ⲭⲉⲣⲉ as an interjection in the checked-in dictionary snapshot", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const entry = dictionary.find((candidate) => candidate.id === "cd_6002");

    expect(entry).toBeDefined();
    expect(entry?.pos).toBe("INJ");
  });

  it("keeps the expanded preposition set tagged as PREP", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const prepositionEntryIds = [
      "cd_355",
      "cd_361",
      "cd_533",
      "cd_611",
      "cd_892",
      "cd_946",
      "cd_947",
      "cd_948",
      "cd_949",
      "cd_950",
      "cd_1173",
      "cd_1713",
      "cd_2073",
      "cd_2382",
      "cd_6272",
      "cd_6273",
      "cd_6274",
      "cd_6275",
      "cd_6276",
      "cd_6277",
      "cd_6278",
      "cd_6279",
      "cd_6280",
      "cd_6281",
      "cd_6282",
      "cd_6283",
      "cd_6284",
      "cd_6285",
      "cd_6286",
      "cd_6287",
      "cd_6288",
    ] as const;

    for (const id of prepositionEntryIds) {
      const entry = dictionary.find((candidate) => candidate.id === id);

      expect(entry).toBeDefined();
      expect(entry?.pos).toBe("PREP");
    }
  });

  it("keeps the expanded bohairic preposition set in canonical bound-form style", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const boundOnlyEntries = [
      {
        id: "cd_611",
        nominal: "ⲉ̀-",
        pronominal: "ⲉ̀ⲣⲟ=",
        etymology: "Egy",
      },
      {
        id: "cd_533",
        nominal: "ⲁⲧϭⲛⲉ-",
        pronominal: "ⲁⲧϭⲛⲟⲩ=",
        etymology: "Egy",
      },
      {
        id: "cd_946",
        nominal: "ⲛ̀-",
        pronominal: "ⲙ̀ⲙⲟ=",
        etymology: "Egy",
      },
      {
        id: "cd_947",
        nominal: "ⲛ̀-",
        pronominal: "ⲛⲁ=",
        etymology: "Egy",
      },
      {
        id: "cd_1173",
        nominal: "ⲛ̀ⲧⲉ-",
        pronominal: "ⲛ̀ⲧⲁ=",
        etymology: "Egy",
      },
      {
        id: "cd_1713",
        nominal: "ⲟⲩⲧⲉ-",
        pronominal: "ⲟⲩⲧⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲕⲁⲧⲁ-",
        nominal: "ⲕⲁⲧⲁ-",
        pronominal: "ⲕⲁⲧⲁⲣⲟ=",
        etymology: "Gr",
      },
      {
        headword: "ϩⲱⲥ-",
        nominal: "ϩⲱⲥ-",
        pronominal: "",
        etymology: "Gr",
      },
      {
        headword: "ⲙⲉⲛⲉⲛⲥⲁ-",
        nominal: "ⲙⲉⲛⲉⲛⲥⲁ-",
        pronominal: "ⲙⲉⲛⲉⲛⲥⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ⲃⲟⲗ ⳳⲉⲛ-",
        nominal: "ⲉ̀ⲃⲟⲗ ⳳⲉⲛ-",
        pronominal: "ⲉ̀ⲃⲟⲗ ⲛ̀ⳳⲏⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ⲃⲟⲗ ϩⲓⲧⲉⲛ-",
        nominal: "ⲉ̀ⲃⲟⲗ ϩⲓⲧⲉⲛ-",
        pronominal: "ⲉ̀ⲃⲟⲗ ϩⲓⲧⲟⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ⲃⲟⲗ ⲛ̀-",
        nominal: "ⲉ̀ⲃⲟⲗ ⲛ̀-",
        pronominal: "ⲉ̀ⲃⲟⲗ ⲙ̀ⲙⲟ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛ̀ⲥⲁ-",
        nominal: "ⲛ̀ⲥⲁ-",
        pronominal: "ⲛ̀ⲥⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ϫⲉⲛ-",
        nominal: "ⲉ̀ϫⲉⲛ-",
        pronominal: "ⲉ̀ϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ϩⲓϫⲉⲛ-",
        nominal: "ϩⲓϫⲉⲛ-",
        pronominal: "ϩⲓϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ϩ̀ⲣⲏⲓ ⲉ̀ϫⲉⲛ-",
        nominal: "ⲉ̀ϩ̀ⲣⲏⲓ ⲉ̀ϫⲉⲛ-",
        pronominal: "ⲉ̀ϩ̀ⲣⲏⲓ ⲉ̀ϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ϩ̀ⲣⲏⲓ ϩⲓϫⲉⲛ-",
        nominal: "ⲉ̀ϩ̀ⲣⲏⲓ ϩⲓϫⲉⲛ-",
        pronominal: "ⲉ̀ϩ̀ⲣⲏⲓ ϩⲓϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛ̀ⳳ̀ⲣⲏⲓ ⳳⲉⲛ-",
        nominal: "ⲛ̀ⳳ̀ⲣⲏⲓ ⳳⲉⲛ-",
        pronominal: "ⲛ̀ⳳ̀ⲣⲏⲓ ⲛ̀ⳳⲏⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛⲁϩ̀ⲣⲉⲛ-",
        nominal: "ⲛⲁϩ̀ⲣⲉⲛ-",
        pronominal: "ⲛⲁϩ̀ⲣⲁ=",
        etymology: "Egy",
      },
      {
        headword: "ⳳⲁⲧⲉⲛ-",
        nominal: "ⳳⲁⲧⲉⲛ-",
        pronominal: "ⳳⲁⲧⲟⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛ̀ⲧⲉⲛ-",
        nominal: "ⲛ̀ⲧⲉⲛ-",
        pronominal: "ⲛ̀ⲧⲟⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ϩⲓⲫⲁϩⲟⲩ ⲛ̀-",
        nominal: "ϩⲓⲫⲁϩⲟⲩ ⲛ̀-",
        pronominal: "ϩⲓⲫⲁϩⲟⲩ ⲙ̀ⲙⲟ=",
        etymology: "Egy",
      },
      {
        headword: "ϩⲓⲧⲉⲛ-",
        nominal: "ϩⲓⲧⲉⲛ-",
        pronominal: "ϩⲓⲧⲟⲧ=",
        etymology: "Egy",
      },
    ] as const;

    for (const expected of boundOnlyEntries) {
      const entry =
        "id" in expected
          ? dictionary.find((candidate) => candidate.id === expected.id)
          : dictionary.find(
              (candidate) => candidate.headword === expected.headword,
            );

      expect(entry).toBeDefined();
      expect(entry?.dialects.B).toMatchObject({
        absolute: "",
        nominal: expected.nominal,
        pronominal: expected.pronominal,
      });
      expect(entry?.etymology).toBe(expected.etymology);
    }
  });
});
