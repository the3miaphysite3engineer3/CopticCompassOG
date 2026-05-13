import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DICTIONARY_DIALECT_CODES,
  DICTIONARY_MEANING_GROUP_CODES,
  PARTS_OF_SPEECH,
} from "@/features/dictionary/config";
import { getGenderedHeadingParts } from "@/features/dictionary/lib/entryDisplay";
import { getEntryNounGender } from "@/features/dictionary/lib/entryGrammar";
import {
  prepareDictionaryForSearch,
  searchPreparedDictionary,
} from "@/features/dictionary/search";
import type {
  ConstructParticipleCompound,
  DialectForms,
  LexicalEntry,
} from "@/features/dictionary/types";

function readDictionary() {
  const filePath = path.join(process.cwd(), "public/data/dictionary.json");

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as LexicalEntry[];
}

function splitTopLevelCommaSeparatedValues(value: string) {
  const parts: string[] = [];
  let currentPart = "";
  let bracketDepth = 0;
  let parenthesisDepth = 0;

  for (const character of value) {
    if (character === "(") {
      parenthesisDepth += 1;
    } else if (character === ")" && parenthesisDepth > 0) {
      parenthesisDepth -= 1;
    } else if (character === "[") {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    }

    if (character === "," && bracketDepth === 0 && parenthesisDepth === 0) {
      parts.push(currentPart.trim());
      currentPart = "";
    } else {
      currentPart += character;
    }
  }

  parts.push(currentPart.trim());

  return parts.filter(Boolean);
}

function hasHeadwordOrAbsoluteStructuralNotation(value: string) {
  const standaloneGenderMarker = /\(([ⲡⲧ](?:\s*,\s*[ⲡⲧ])*)\)(?=\s|$|→|=|,)/u;
  const standalonePluralMarker = /(^|\s)\(ⲛ\)(?=\s|$|→|=|,)/u;

  return (
    /[,=→]/u.test(value) ||
    standaloneGenderMarker.test(value) ||
    standalonePluralMarker.test(value)
  );
}

function collectConstructParticiples(forms: DialectForms | undefined) {
  return [
    ...(forms?.constructParticiples ?? []),
    ...(forms?.variants?.constructParticiples ?? []),
  ];
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function validateConstructParticipleCompound(
  compound: ConstructParticipleCompound,
) {
  return (
    typeof compound.form === "string" &&
    compound.form.trim().length > 0 &&
    !compound.form.endsWith("~") &&
    (compound.sourceConstructParticiple === undefined ||
      compound.sourceConstructParticiple.endsWith("~")) &&
    (compound.gender === undefined ||
      ["", "BOTH", "F", "M"].includes(compound.gender)) &&
    isNonEmptyStringArray(compound.english_meanings) &&
    (compound.dutch_meanings === undefined ||
      isNonEmptyStringArray(compound.dutch_meanings))
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const pluralPrefixedHeadwordPattern = /^plural:/iu;
const deprecatedTopLevelEntryFields = [
  "dutch_meanings",
  "english_meanings",
  "gender",
  "parentEntryId",
  "pluralForms",
  "pos",
  "relationType",
] as const;
const allowedGrammarKeys = new Set([
  "affix",
  "caseRole",
  "derivation",
  "form",
  "gender",
  "mood",
  "number",
  "polarity",
  "pos",
  "tags",
  "valency",
  "voice",
]);
const allowedGrammarPos = new Set([...PARTS_OF_SPEECH, "PRON"]);
const allowedEtymologies = new Set(["Egy", "Gr", "Unknown"]);
const allowedGrammarTags = new Set<string>(DICTIONARY_MEANING_GROUP_CODES);
const grammarEnumFields = {
  affix: ["PFX", "SFX"],
  caseRole: ["DAT", "OBJ"],
  derivation: ["CAUS"],
  form: ["ABS", "PC", "STA", "VBAL"],
  gender: ["BOTH", "F", "M"],
  mood: ["IMP"],
  number: ["PL", "SG"],
  polarity: ["NEG"],
  valency: ["INTR", "TR"],
  voice: ["REFL"],
} as const;
const absorbedDirectVariantExamples = [
  { canonicalId: "cd_4012", form: "ⲇⲓⲛⲁⲧⲟⲥ", removedId: "cd_3973" },
  { canonicalId: "cd_3900", form: "ⲇⲓⲡⲛⲟⲛ", removedId: "cd_3983" },
  { canonicalId: "cd_4741", form: "ⲕⲩⲃⲱⲧⲟⲥ", removedId: "cd_4837" },
] as const;
const absorbedExactDuplicateExamples = [
  { canonicalId: "cd_10", form: "ϣ-", removedId: "cd_6123" },
  { canonicalId: "cd_826", form: "ⲕⲁⲣⲟⲩⲥ", removedId: "cd_4648" },
  { canonicalId: "cd_957", form: "ⲗⲓⲙⲏⲛ", removedId: "cd_4907" },
  { canonicalId: "cd_1007", form: "ⲙⲏ", removedId: "cd_5039" },
  { canonicalId: "cd_1204", form: "ⲟ", removedId: "cd_5157" },
  { canonicalId: "cd_1410", form: "ⲥⲁⲛⲓⲥ", removedId: "cd_5528" },
  { canonicalId: "cd_1966", form: "ϣⲉⲩ", removedId: "cd_3156" },
  { canonicalId: "cd_2635", form: "ⲁⲙⲛⲁ", removedId: "cd_3516" },
  { canonicalId: "cd_5132", form: "ⲛⲟⲩⲥ", removedId: "cd_2968" },
] as const;
const absorbedBoundaryVariantExamples = [
  { canonicalId: "cd_126", form: "ⲥⲟⲩ", removedId: "cd_5599" },
  {
    canonicalId: "cd_4785",
    form: "ⲕⲱⲙⲟⲡⲟⲗⲓⲥ",
    removedId: "cd_4869",
  },
] as const;
const absorbedGreekOneLetterVariantExamples = [
  { canonicalId: "cd_3599", form: "ⲁⲡⲁⲅⲅⲉⲗⲓⲛ", removedId: "cd_3601" },
  { canonicalId: "cd_3798", form: "ⲃⲁⲥⲓⲗⲓⲁ", removedId: "cd_3800" },
  { canonicalId: "cd_4887", form: "ⲗⲓⲧⲟⲩⲣⲅⲓⲁ", removedId: "cd_4913" },
  { canonicalId: "cd_6025", form: "ⲭⲓⲣⲟⲅⲣⲁⲫⲟⲛ", removedId: "cd_6038" },
] as const;
const absorbedEgyptianOneLetterVariantExamples = [
  { canonicalId: "cd_37", form: "ⲕⲱⲡ", removedId: "cd_806" },
  { canonicalId: "cd_193", form: "ϩⲣⲧⲉ", removedId: "cd_2231" },
  { canonicalId: "cd_285", form: "ϣⲁⲁⲃ", removedId: "cd_1824" },
] as const;
const foldedRegularFeminineCounterpartExamples = [
  {
    feminineForm: "ⲟⲩⲣⲱ",
    parentId: "cd_18",
    removedId: "cd_18a",
  },
  {
    feminineForm: "ϣⲉⲣⲓ",
    parentId: "cd_20",
    removedId: "cd_20a",
  },
  {
    feminineForm: "ⲃⲱⲕⲓ",
    parentId: "cd_550",
    removedId: "cd_550a",
  },
] as const;
const independentGreekErPrefixComplexVerbExamples = [
  { baseId: "cd_3348", complexId: "cd_4146", form: "ⲉⲣⲁⲅⲁⲡⲁⲛ" },
  { baseId: "cd_4867", complexId: "cd_4240", form: "ⲉⲣⲕⲱⲗⲩⲉⲓⲛ" },
  { baseId: "cd_5522", complexId: "cd_4300", form: "ⲉⲣⲥⲁⲗⲡⲓⲍⲉⲓⲛ" },
  { baseId: "cd_6046", complexId: "cd_4336", form: "ⲉⲣⲭⲟⲣⲉⲩⲉⲓⲛ" },
] as const;
const numberMeaningPatterns = [
  /\b(?:plural|singular|meervoud|enkelvoud):/iu,
  /\b(?:as|mostly|used as|or)\s+PL\b/iu,
  /\b\d+d\s+is\s+PL\b/iu,
  /\bPL\s*\(/u,
  /\bSG\s+PL\b/u,
  /\bplural\s+IMP\s+verb\b/iu,
  /\b(?:meestal|als)\s+meervoud\b/iu,
] as const;
const placeholderMeaningPatterns = [/^(?:which|welke):$/iu] as const;

function collectMeaningTexts(entry: LexicalEntry) {
  return [
    ...entry.meaningGroups.flatMap((group) => [
      ...(group.english_meanings ?? []),
      ...(group.dutch_meanings ?? []),
    ]),
    ...(entry.dialectMeanings ?? []).flatMap((meaning) => [
      ...(meaning.english_meanings ?? []),
      ...(meaning.dutch_meanings ?? []),
    ]),
    ...(entry.genderedMeanings ?? []).flatMap((meaning) => [
      ...Object.values(meaning.english),
      ...Object.values(meaning.dutch ?? {}),
    ]),
  ];
}

function hasNumberMarkedMeaningProse(entry: LexicalEntry) {
  return collectMeaningTexts(entry).some((meaning) =>
    numberMeaningPatterns.some((pattern) => pattern.test(meaning)),
  );
}

function hasPlaceholderMeaning(value: string) {
  return placeholderMeaningPatterns.some((pattern) =>
    pattern.test(value.trim()),
  );
}

function findMeaningGroup(
  entry: LexicalEntry | undefined,
  predicate: (
    group: NonNullable<LexicalEntry["meaningGroups"]>[number],
  ) => boolean,
) {
  return entry?.meaningGroups.find(predicate);
}

describe("dictionary dataset guardrails", () => {
  it("keeps dialect and inflected-form keys within the configured dictionary sigla", () => {
    const dictionary = readDictionary();
    const allowedDialectCodes = new Set<string>(DICTIONARY_DIALECT_CODES);
    const unexpectedDialectKeys: Array<{ dialect: string; id: string }> = [];
    const unexpectedInflectedFormDialectKeys: Array<{
      dialect: string;
      id: string;
    }> = [];

    for (const entry of dictionary) {
      for (const dialect of Object.keys(entry.dialects)) {
        if (!allowedDialectCodes.has(dialect)) {
          unexpectedDialectKeys.push({ dialect, id: entry.id });
        }
      }

      for (const inflectedForm of entry.inflectedForms ?? []) {
        if (
          inflectedForm.dialect &&
          !allowedDialectCodes.has(inflectedForm.dialect)
        ) {
          unexpectedInflectedFormDialectKeys.push({
            dialect: inflectedForm.dialect,
            id: entry.id,
          });
        }
      }
    }

    expect(unexpectedDialectKeys).toEqual([]);
    expect(unexpectedInflectedFormDialectKeys).toEqual([]);
  });

  it("omits deprecated entry-shape artifacts from the dataset", () => {
    const dictionary = readDictionary();
    const entriesWithDeprecatedFields = dictionary.flatMap((entry) =>
      deprecatedTopLevelEntryFields.flatMap((field) =>
        Object.prototype.hasOwnProperty.call(entry, field)
          ? [{ field, id: entry.id }]
          : [],
      ),
    );
    const pluralPrefixedHeadwordEntries = dictionary
      .filter((entry) => pluralPrefixedHeadwordPattern.test(entry.headword))
      .map((entry) => ({
        headword: entry.headword,
        id: entry.id,
      }));

    expect(entriesWithDeprecatedFields).toEqual([]);
    expect(pluralPrefixedHeadwordEntries).toEqual([]);
  });

  it("requires explicit etymology values on every entry", () => {
    const dictionary = readDictionary();
    const invalidEtymologyEntries = dictionary.flatMap((entry) =>
      typeof entry.etymology !== "string" ||
      !allowedEtymologies.has(entry.etymology)
        ? [{ etymology: entry.etymology, id: entry.id }]
        : [],
    );

    expect(invalidEtymologyEntries).toEqual([]);
    expect(dictionary.filter((entry) => entry.etymology === "Unknown")).toEqual(
      [
        expect.objectContaining({ headword: "ϫⲗⲉ", id: "cd_7166" }),
        expect.objectContaining({
          headword: "ϯϫⲣⲉ ⲛϩⲏⲧ",
          id: "cd_7348",
        }),
      ],
    );
  });

  it("omits empty Greek equivalent arrays", () => {
    const dictionary = readDictionary();
    const invalidGreekEquivalentEntries = dictionary
      .filter(
        (entry) =>
          Object.prototype.hasOwnProperty.call(entry, "greek_equivalents") &&
          !isNonEmptyStringArray(entry.greek_equivalents),
      )
      .map((entry) => entry.id);

    expect(invalidGreekEquivalentEntries).toEqual([]);
  });

  it("keeps meaning groups annotated with structured grammar", () => {
    const dictionary = readDictionary();
    const emptyMeaningGroupEntries: string[] = [];
    const invalidMeaningGroupEntries: string[] = [];
    const missingMeaningGroupEntries: string[] = [];
    const missingGrammarGroups: Array<{ id: string; index: number }> = [];
    const invalidGrammarGroups: Array<{
      id: string;
      index: number;
      reason: string;
      value: unknown;
    }> = [];

    for (const entry of dictionary) {
      if (!Object.prototype.hasOwnProperty.call(entry, "meaningGroups")) {
        missingMeaningGroupEntries.push(entry.id);
        continue;
      }

      if (!Array.isArray(entry.meaningGroups)) {
        invalidMeaningGroupEntries.push(entry.id);
        continue;
      }

      if (entry.meaningGroups.length === 0) {
        emptyMeaningGroupEntries.push(entry.id);
        continue;
      }

      for (const [index, group] of entry.meaningGroups.entries()) {
        const grammar = group.grammar;

        if (!isPlainRecord(grammar)) {
          missingGrammarGroups.push({ id: entry.id, index });
          continue;
        }

        const grammarEntries = Object.entries(grammar);

        if (grammarEntries.length === 0) {
          invalidGrammarGroups.push({
            id: entry.id,
            index,
            reason: "empty grammar",
            value: grammar,
          });
        }

        if (grammar.pos === undefined) {
          invalidGrammarGroups.push({
            id: entry.id,
            index,
            reason: "missing pos",
            value: grammar,
          });
        }

        for (const [key, value] of grammarEntries) {
          if (!allowedGrammarKeys.has(key)) {
            invalidGrammarGroups.push({
              id: entry.id,
              index,
              reason: `unexpected key ${key}`,
              value,
            });
            continue;
          }

          if (key === "pos" && !allowedGrammarPos.has(String(value))) {
            invalidGrammarGroups.push({
              id: entry.id,
              index,
              reason: "invalid pos",
              value,
            });
          }

          if (key === "tags") {
            const tags = Array.isArray(value) ? value : [];

            if (
              tags.length === 0 ||
              tags.some(
                (tag) =>
                  typeof tag !== "string" || !allowedGrammarTags.has(tag),
              )
            ) {
              invalidGrammarGroups.push({
                id: entry.id,
                index,
                reason: "invalid tags",
                value,
              });
            }
            continue;
          }

          if (
            key in grammarEnumFields &&
            !grammarEnumFields[key as keyof typeof grammarEnumFields].includes(
              value as never,
            )
          ) {
            invalidGrammarGroups.push({
              id: entry.id,
              index,
              reason: `invalid ${key}`,
              value,
            });
          }
        }

        if (grammar.gender !== undefined && grammar.pos !== "N") {
          invalidGrammarGroups.push({
            id: entry.id,
            index,
            reason: "gender without noun pos",
            value: grammar,
          });
        }

        if (
          (grammar.valency !== undefined ||
            grammar.mood !== undefined ||
            grammar.voice !== undefined ||
            grammar.derivation !== undefined ||
            grammar.form === "PC" ||
            grammar.form === "STA") &&
          grammar.pos !== "V"
        ) {
          invalidGrammarGroups.push({
            id: entry.id,
            index,
            reason: "verbal grammar without verb pos",
            value: grammar,
          });
        }
      }
    }

    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));

    expect(emptyMeaningGroupEntries).toEqual([]);
    expect(invalidMeaningGroupEntries).toEqual([]);
    expect(missingMeaningGroupEntries).toEqual([]);
    expect(missingGrammarGroups).toEqual([]);
    expect(invalidGrammarGroups).toEqual([]);
    expect(
      findMeaningGroup(
        entriesById.get("cd_2"),
        (group) => group.grammar.valency === "INTR",
      )?.grammar,
    ).toEqual({ pos: "V", valency: "INTR" });
    expect(
      findMeaningGroup(
        entriesById.get("cd_25"),
        (group) => group.grammar.pos === "N",
      )?.grammar,
    ).toEqual({ gender: "M", pos: "N" });
    expect(
      findMeaningGroup(
        entriesById.get("cd_100"),
        (group) => group.grammar.number === "PL",
      )?.grammar,
    ).toEqual({ number: "PL", pos: "N" });
    expect(
      findMeaningGroup(
        entriesById.get("cd_2639"),
        (group) => group.grammar.polarity === "NEG",
      )?.grammar,
    ).toEqual({ polarity: "NEG", pos: "N" });
  });

  it("keeps direct variant-collision duplicate rows folded into canonical entries", () => {
    const dictionary = readDictionary();
    const entryIds = new Set(dictionary.map((entry) => entry.id));
    const entryAliases = dictionary.flatMap((entry) =>
      Object.prototype.hasOwnProperty.call(entry, "entryAliases")
        ? [entry.id]
        : [],
    );

    expect(entryAliases).toEqual([]);
    expect(
      absorbedDirectVariantExamples.map(({ canonicalId, removedId }) => ({
        canonicalExists: entryIds.has(canonicalId),
        removedExists: entryIds.has(removedId),
      })),
    ).toEqual(
      absorbedDirectVariantExamples.map(() => ({
        canonicalExists: true,
        removedExists: false,
      })),
    );
  });

  it("keeps exact duplicate headword rows folded into canonical entries", () => {
    const dictionary = readDictionary();
    const entryIds = new Set(dictionary.map((entry) => entry.id));

    expect(
      absorbedExactDuplicateExamples.map(({ canonicalId, removedId }) => ({
        canonicalExists: entryIds.has(canonicalId),
        removedExists: entryIds.has(removedId),
      })),
    ).toEqual(
      absorbedExactDuplicateExamples.map(() => ({
        canonicalExists: true,
        removedExists: false,
      })),
    );
  });

  it("keeps reviewed boundary variants modeled without duplicate rows", () => {
    const dictionary = readDictionary();
    const entryIds = new Set(dictionary.map((entry) => entry.id));

    expect(
      absorbedBoundaryVariantExamples.map(({ canonicalId, removedId }) => ({
        canonicalExists: entryIds.has(canonicalId),
        removedExists: entryIds.has(removedId),
      })),
    ).toEqual(
      absorbedBoundaryVariantExamples.map(() => ({
        canonicalExists: true,
        removedExists: false,
      })),
    );
    const souEntry = dictionary.find((entry) => entry.id === "cd_126");

    expect(
      findMeaningGroup(souEntry, (group) => group.grammar.pos === "V"),
    ).toBeDefined();
    const komopolisEntry = dictionary.find((entry) => entry.id === "cd_4785");

    expect(
      findMeaningGroup(komopolisEntry, (group) => group.grammar.pos === "N"),
    ).toMatchObject({ grammar: { gender: "BOTH", pos: "N" } });
    expect(
      findMeaningGroup(
        dictionary.find((entry) => entry.id === "cd_5345"),
        (group) => group.grammar.pos === "N",
      ),
    ).toMatchObject({ grammar: { gender: "F", pos: "N" } });
  });

  it("keeps reviewed Greek one-letter spelling variants modeled without duplicate rows", () => {
    const dictionary = readDictionary();
    const entryIds = new Set(dictionary.map((entry) => entry.id));

    expect(
      absorbedGreekOneLetterVariantExamples.map(
        ({ canonicalId, removedId }) => ({
          canonicalExists: entryIds.has(canonicalId),
          removedExists: entryIds.has(removedId),
        }),
      ),
    ).toEqual(
      absorbedGreekOneLetterVariantExamples.map(() => ({
        canonicalExists: true,
        removedExists: false,
      })),
    );
  });

  it("keeps reviewed Egyptian one-letter spelling variants modeled without duplicate rows", () => {
    const dictionary = readDictionary();
    const entryIds = new Set(dictionary.map((entry) => entry.id));

    expect(
      absorbedEgyptianOneLetterVariantExamples.map(
        ({ canonicalId, removedId }) => ({
          canonicalExists: entryIds.has(canonicalId),
          removedExists: entryIds.has(removedId),
        }),
      ),
    ).toEqual(
      absorbedEgyptianOneLetterVariantExamples.map(() => ({
        canonicalExists: true,
        removedExists: false,
      })),
    );
  });

  it("keeps regular feminine counterpart forms folded into parent entries", () => {
    const dictionary = readDictionary();
    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));

    for (const example of foldedRegularFeminineCounterpartExamples) {
      const parentEntry = entriesById.get(example.parentId);

      expect(parentEntry?.inflectedForms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            form: example.feminineForm,
            kind: "feminine",
          }),
        ]),
      );
      expect(entriesById.has(example.removedId)).toBe(false);
    }
    expect(entriesById.get("cd_1698")).toMatchObject({
      headword: "ⲟⲩⲣⲱ",
    });
    expect(
      findMeaningGroup(entriesById.get("cd_1698"), (group) =>
        Boolean(group.english_meanings?.includes("bean")),
      ),
    ).toMatchObject({
      dutch_meanings: ["boon"],
      english_meanings: ["bean"],
      grammar: { gender: "M", pos: "N" },
    });
  });

  it("keeps Bohairic er-prefix Greek complex verbs as independent entries", () => {
    const dictionary = readDictionary();
    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));

    for (const example of independentGreekErPrefixComplexVerbExamples) {
      expect(entriesById.get(example.baseId)).toMatchObject({
        etymology: "Gr",
      });
      expect(entriesById.get(example.complexId)).toMatchObject({
        etymology: "Gr",
        headword: example.form,
      });
      expect(
        findMeaningGroup(
          entriesById.get(example.complexId),
          (group) => group.grammar.pos === "V",
        ),
      ).toBeDefined();
    }
  });

  it("keeps all plural forms structured as inflected forms", () => {
    const dictionary = readDictionary();
    const structuredPluralFormCount = dictionary.reduce(
      (count, entry) =>
        count +
        (entry.inflectedForms ?? []).filter((form) => form.kind === "plural")
          .length,
      0,
    );

    expect(structuredPluralFormCount).toBe(598);
  });

  it("keeps number-marked meaning prose in structured meaning groups", () => {
    const dictionary = readDictionary();
    const numberMarkedEntries = dictionary
      .filter(hasNumberMarkedMeaningProse)
      .map((entry) => ({
        headword: entry.headword,
        id: entry.id,
      }));

    expect(numberMarkedEntries).toEqual([]);
  });

  it("keeps representative structured plural forms searchable", () => {
    const dictionary = readDictionary();
    const preparedDictionary = prepareDictionaryForSearch(dictionary);
    const searchIds = (query: string) =>
      searchPreparedDictionary(query, preparedDictionary, dictionary, true).map(
        (entry) => entry.id,
      );

    expect(searchIds("ⲁϩⲱⲱⲣ")).toContain("cd_7");
    expect(searchIds("ⲟⲩⲣⲱⲟⲩ")).toContain("cd_18");
    expect(searchIds("ⲉⲃⲓⲁⲓⲕ")).toContain("cd_550");
  });

  it("keeps absorbed duplicate headwords searchable on canonical entries", () => {
    const dictionary = readDictionary();
    const preparedDictionary = prepareDictionaryForSearch(dictionary);
    const searchIds = (query: string) =>
      searchPreparedDictionary(query, preparedDictionary, dictionary, true).map(
        (entry) => entry.id,
      );

    for (const example of absorbedDirectVariantExamples) {
      const ids = searchIds(example.form);

      expect(ids).toContain(example.canonicalId);
      expect(ids).not.toContain(example.removedId);
    }
    for (const example of [
      absorbedExactDuplicateExamples[1],
      absorbedExactDuplicateExamples[2],
      absorbedExactDuplicateExamples[8],
    ]) {
      const ids = searchIds(example.form);

      expect(ids).toContain(example.canonicalId);
      expect(ids).not.toContain(example.removedId);
    }
    for (const example of absorbedBoundaryVariantExamples) {
      const ids = searchIds(example.form);

      expect(ids).toContain(example.canonicalId);
      expect(ids).not.toContain(example.removedId);
    }
    for (const example of absorbedGreekOneLetterVariantExamples) {
      const ids = searchIds(example.form);

      expect(ids).toContain(example.canonicalId);
      expect(ids).not.toContain(example.removedId);
    }
    for (const example of absorbedEgyptianOneLetterVariantExamples) {
      const ids = searchIds(example.form);

      expect(ids).toContain(example.canonicalId);
      expect(ids).not.toContain(example.removedId);
    }
    for (const example of independentGreekErPrefixComplexVerbExamples) {
      const ids = searchIds(example.form);

      expect(ids).toContain(example.complexId);
      expect(ids).not.toContain(example.baseId);
    }
  });

  it("keeps folded regular feminine forms searchable on parent entries", () => {
    const dictionary = readDictionary();
    const preparedDictionary = prepareDictionaryForSearch(dictionary);
    const searchIds = (query: string) =>
      searchPreparedDictionary(query, preparedDictionary, dictionary, true).map(
        (entry) => entry.id,
      );

    for (const example of foldedRegularFeminineCounterpartExamples) {
      const ids = searchIds(example.feminineForm);

      expect(ids).toContain(example.parentId);
      expect(ids).not.toContain(example.removedId);
    }
    expect(searchIds("ⲟⲩⲣⲱ")).toContain("cd_1698");
  });

  it("omits source-only metadata from runtime dictionary entries", () => {
    const dictionary = readDictionary();
    const forbiddenKeys = new Set([
      "attestation",
      "attestations",
      "bohairicParadigmData",
      "entryAliases",
      "raw",
      "rawData",
      "sourceNote",
      "sourceNotes",
    ]);
    const sourceOnlyMetadataKeys = dictionary.flatMap((entry) =>
      Object.keys(entry)
        .filter((key) => forbiddenKeys.has(key))
        .map((key) => ({ id: entry.id, key })),
    );

    expect(sourceOnlyMetadataKeys).toEqual([]);
  });

  it("keeps primary spellings free of variant lists and state metadata", () => {
    const dictionary = readDictionary();
    const structurallyNoisyFields: Array<{
      field: string;
      id: string;
      value: string;
    }> = [];
    const primaryFormFields = [
      "absolute",
      "nominal",
      "pronominal",
      "stative",
    ] as const;

    for (const entry of dictionary) {
      if (
        splitTopLevelCommaSeparatedValues(entry.headword).length > 1 ||
        hasHeadwordOrAbsoluteStructuralNotation(entry.headword)
      ) {
        structurallyNoisyFields.push({
          field: "headword",
          id: entry.id,
          value: entry.headword,
        });
      }

      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        for (const field of primaryFormFields) {
          const value = forms[field] ?? "";

          if (
            splitTopLevelCommaSeparatedValues(value).length > 1 ||
            (field === "absolute" &&
              hasHeadwordOrAbsoluteStructuralNotation(value))
          ) {
            structurallyNoisyFields.push({
              field: `${dialect}.${field}`,
              id: entry.id,
              value,
            });
          }
        }

        for (const value of forms.variants?.absolute ?? []) {
          if (hasHeadwordOrAbsoluteStructuralNotation(value)) {
            structurallyNoisyFields.push({
              field: `${dialect}.variants.absolute`,
              id: entry.id,
              value,
            });
          }
        }
      }
    }

    expect(structurallyNoisyFields).toEqual([]);
  });

  it("keeps imperative forms structured on parent entries", () => {
    const dictionary = readDictionary();
    const entryIds = new Set(dictionary.map((entry) => entry.id));
    const foldedImperativeEntryIds = [
      "cd_2b",
      "cd_8b",
      "cd_23b",
      "cd_30b",
      "cd_34b",
      "cd_43a",
      "cd_123b",
      "cd_219b",
      "cd_312c",
      "cd_312d",
    ];
    const entriesWithLegacyImperativeFields = dictionary
      .filter((entry) =>
        Object.values(entry.dialects).some((forms) =>
          Object.prototype.hasOwnProperty.call(forms, "imperatives"),
        ),
      )
      .map((entry) => entry.id);
    const imperativeFormCount = dictionary.reduce(
      (count, entry) =>
        count +
        (entry.inflectedForms ?? []).filter(
          (form) => form.kind === "imperative",
        ).length,
      0,
    );
    const parentEntry = dictionary.find((entry) => entry.id === "cd_2");

    expect(entriesWithLegacyImperativeFields).toEqual([]);
    expect(foldedImperativeEntryIds.filter((id) => entryIds.has(id))).toEqual(
      [],
    );
    expect(imperativeFormCount).toBe(84);
    expect(parentEntry?.dialects.B).toMatchObject({
      absolute: "ϯ",
      variants: {
        pronominal: ["ⲧⲏⲓⲧ="],
      },
    });
    expect(parentEntry?.inflectedForms).toEqual(
      expect.arrayContaining([
        {
          dialect: "B",
          form: "ⲙⲟⲓ",
          kind: "imperative",
          role: "absolute",
        },
        {
          dialect: "B",
          form: "ⲙⲁ-",
          kind: "imperative",
          role: "nominal",
        },
        {
          dialect: "B",
          form: "ⲙⲏⲓ=",
          kind: "imperative",
          role: "pronominal",
        },
        {
          dialect: "B",
          form: "ⲙⲏⲓⲧ=",
          kind: "imperative",
          notes: ["Imperative variant."],
          role: "pronominal",
        },
      ]),
    );
  });

  it("keeps structured gendered forms displayable as gendered headings", () => {
    const dictionary = readDictionary();
    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));
    const masculineEntriesWithFeminineForms = dictionary
      .filter(
        (entry) =>
          getEntryNounGender(entry) === "M" &&
          (entry.inflectedForms ?? []).some((form) => form.kind === "feminine"),
      )
      .map((entry) => entry.id)
      .sort((left, right) => left.localeCompare(right));

    expect(masculineEntriesWithFeminineForms).toEqual([
      "cd_18",
      "cd_20",
      "cd_550",
    ]);
    expect(
      getGenderedHeadingParts(entriesById.get("cd_18")!, "B").map(
        (part) => `${part.spelling} ${part.marker}`,
      ),
    ).toEqual(["ⲟⲩⲣⲟ m", "ⲟⲩⲣⲱ f", "ⲟⲩⲣⲱⲟⲩ pl"]);
    expect(
      getGenderedHeadingParts(entriesById.get("cd_20")!, "B").map(
        (part) => `${part.spelling} ${part.marker}`,
      ),
    ).toEqual(["ϣⲏⲣⲓ ϣⲟⲩ- m", "ϣⲉⲣⲓ f"]);
    expect(entriesById.get("cd_20")?.genderedMeanings).toEqual([
      {
        dutch: {
          f: "dochter",
          m: "zoon, kind",
        },
        english: {
          f: "daughter",
          m: "son, child",
        },
      },
    ]);
    expect(entriesById.get("cd_18")?.genderedMeanings).toEqual([
      {
        dutch: {
          f: "koningin",
          m: "koning",
          pl: "koninklijken",
        },
        english: {
          f: "queen",
          m: "king",
          pl: "royals",
        },
      },
    ]);
    expect(entriesById.get("cd_17")?.genderedMeanings).toEqual([
      {
        dutch: {
          f: "dame",
          m: "heer",
          pl: "edelen",
        },
        english: {
          f: "lady",
          m: "lord",
          pl: "nobles",
        },
      },
    ]);
    expect(
      entriesById.get("cd_18")?.meaningGroups.map((group) => group.grammar),
    ).toEqual([{ gender: "M", pos: "N" }, { pos: "ADJ" }]);
    expect(
      findMeaningGroup(
        entriesById.get("cd_18"),
        (group) => group.grammar.pos === "ADJ",
      )?.english_meanings,
    ).toEqual(["royal"]);
    expect(
      entriesById.get("cd_17")?.meaningGroups.map((group) => group.grammar),
    ).toEqual([{ gender: "BOTH", pos: "N" }, { pos: "ADJ" }]);
    expect(
      findMeaningGroup(
        entriesById.get("cd_17"),
        (group) => group.grammar.pos === "ADJ",
      )?.english_meanings,
    ).toEqual(["noble"]);
    expect(entriesById.get("cd_550")?.meaningGroups).toEqual([
      { grammar: { gender: "M", pos: "N" } },
    ]);
    expect(
      getGenderedHeadingParts(entriesById.get("cd_550")!, "B").map(
        (part) => `${part.spelling} ${part.marker}`,
      ),
    ).toEqual(["ⲃⲱⲕ m", "ⲃⲱⲕⲓ f", "ⲉⲃⲓⲁⲓⲕ pl"]);
    expect(entriesById.get("cd_5345")).toMatchObject({
      headword: "ⲡⲏⲣⲁ",
      meaningGroups: [
        {
          grammar: { gender: "F", pos: "N" },
        },
      ],
    });
  });

  it("keeps Oxyrhynchite coverage under dialect M", () => {
    const dictionary = readDictionary();
    const oxyrhynchiteEntries = dictionary.filter((entry) => entry.dialects.M);

    expect(oxyrhynchiteEntries.length).toBeGreaterThanOrEqual(484);
    expect(
      dictionary.find((entry) => entry.id === "cd_493")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲁⲛⲁⲕ",
      nominal: "ⲁⲛⲕ-",
    });
    const oxyrhynchiteFenceEntry = dictionary.find(
      (entry) => entry.id === "cd_7166",
    );

    expect(oxyrhynchiteFenceEntry).toMatchObject({
      dialects: {
        M: {
          absolute: "ϫⲗⲉ",
        },
      },
    });
    expect(
      findMeaningGroup(oxyrhynchiteFenceEntry, (group) =>
        Boolean(group.english_meanings?.includes("fence")),
      ),
    ).toMatchObject({
      dutch_meanings: ["omheining"],
      english_meanings: ["fence"],
      grammar: { pos: "N" },
    });
  });

  it("stores construct participles as tilde-marked forms outside nominal state", () => {
    const dictionary = readDictionary();
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
        if (/^PC\b/u.test(forms.nominal ?? "")) {
          nominalConstructParticiples.push({
            dialect,
            form: forms.nominal ?? "",
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

  it("validates construct participle compound records when present", () => {
    const dictionary = readDictionary();
    const malformedCompounds: Array<{
      dialect: string;
      form: string;
      id: string;
    }> = [];
    let compoundCount = 0;

    for (const entry of dictionary) {
      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        for (const compound of forms.constructParticipleCompounds ?? []) {
          compoundCount += 1;

          if (!validateConstructParticipleCompound(compound)) {
            malformedCompounds.push({
              dialect,
              form: compound.form,
              id: entry.id,
            });
          }
        }
      }
    }

    expect(malformedCompounds).toEqual([]);
    expect(compoundCount).toBeGreaterThanOrEqual(260);
  });

  it("keeps meaning group gloss arrays populated when present", () => {
    const dictionary = readDictionary();

    const malformedGroups = dictionary.flatMap((entry) =>
      entry.meaningGroups.flatMap((group, groupIndex) =>
        (
          [
            ["english_meanings", group.english_meanings],
            ["dutch_meanings", group.dutch_meanings],
          ] as const
        ).flatMap(([field, values]) =>
          values === undefined || isNonEmptyStringArray(values)
            ? []
            : [{ field, groupIndex, id: entry.id }],
        ),
      ),
    );

    expect(malformedGroups).toEqual([]);
  });

  it("omits placeholder meaning stubs", () => {
    const dictionary = readDictionary();
    const placeholderMeanings = dictionary.flatMap((entry) =>
      collectMeaningTexts(entry)
        .filter(hasPlaceholderMeaning)
        .map((meaning) => ({ id: entry.id, meaning })),
    );

    expect(placeholderMeanings).toEqual([]);
  });

  it("stores representative bound-only prepositions without fake absolute forms", () => {
    const dictionary = readDictionary();
    const boundOnlyEntries = [
      {
        id: "cd_361",
        dialect: "B",
        nominal: "ⳳⲉⲛ-",
        pronominal: "ⲛ̀ⳳⲏⲧ=",
      },
      {
        id: "cd_892",
        dialect: "B",
        nominal: "ⲛⲉⲙ-",
        pronominal: "ⲛⲉⲙⲁ=",
      },
      {
        id: "cd_1713",
        dialect: "B",
        nominal: "ⲟⲩⲧⲉ-",
        pronominal: "ⲟⲩⲧⲱ=",
      },
    ] as const;

    for (const expected of boundOnlyEntries) {
      const entry = dictionary.find(
        (candidate) => candidate.id === expected.id,
      );
      const forms = entry?.dialects[expected.dialect];

      expect(forms).toMatchObject({
        nominal: expected.nominal,
        pronominal: expected.pronominal,
      });
      expect(forms).not.toHaveProperty("absolute");
    }
  });
});
