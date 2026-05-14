import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DICTIONARY_DIALECT_CODES } from "@/features/dictionary/config";
import {
  formatDictionaryValidationIssues,
  validateDictionaryEntries,
} from "@/features/dictionary/lib/dictionaryValidation";
import { getGenderedHeadingParts } from "@/features/dictionary/lib/entryDisplay";
import { getEntryNounGender } from "@/features/dictionary/lib/entryGrammar";
import {
  prepareDictionaryForSearch,
  searchPreparedDictionary,
} from "@/features/dictionary/search";
import type {
  DictionaryInflectedFormDetails,
  DialectForms,
  LexicalEntry,
} from "@/features/dictionary/types";

function readDictionaryPayload(): unknown {
  const filePath = path.join(process.cwd(), "public/data/dictionary.json");

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readDictionary() {
  return readDictionaryPayload() as LexicalEntry[];
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
    /[,→]/u.test(value) ||
    standaloneGenderMarker.test(value) ||
    standalonePluralMarker.test(value)
  );
}

function collectConstructParticiples(forms: DialectForms | undefined) {
  return [
    ...(forms?.participles ?? []),
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

type FlattenedInflection = {
  dialect: string;
  form: string;
  kind: string;
  notes?: string[];
  role: string;
  uncertain?: boolean;
};

function getInflectionFormText(form: string | DictionaryInflectedFormDetails) {
  return typeof form === "string" ? form : form.form;
}

function flattenInflections(
  entry: Pick<LexicalEntry, "inflections">,
): FlattenedInflection[] {
  return Object.entries(entry.inflections ?? {}).flatMap(([kind, dialects]) =>
    Object.entries(dialects ?? {}).flatMap(([dialect, roles]) =>
      Object.entries(roles ?? {}).flatMap(([role, forms]) =>
        (forms ?? []).map((form) => ({
          dialect,
          form: getInflectionFormText(form),
          kind,
          role,
          ...(typeof form !== "string" && form.notes
            ? { notes: form.notes }
            : {}),
          ...(typeof form !== "string" && form.uncertain !== undefined
            ? { uncertain: form.uncertain }
            : {}),
        })),
      ),
    ),
  );
}

const pluralPrefixedHeadwordPattern = /^plural:/iu;
const allowedEtymologies = new Set(["Egy", "Gr", "Unknown"]);
const absorbedDirectVariantExamples = [
  { canonicalId: 4012, form: "ⲇⲓⲛⲁⲧⲟⲥ", removedId: 3973 },
  { canonicalId: 3900, form: "ⲇⲓⲡⲛⲟⲛ", removedId: 3983 },
  { canonicalId: 4741, form: "ⲕⲩⲃⲱⲧⲟⲥ", removedId: 4837 },
] as const;
const absorbedExactDuplicateExamples = [
  { canonicalId: 10, form: "ϣ-", removedId: 6123 },
  { canonicalId: 826, form: "ⲕⲁⲣⲟⲩⲥ", removedId: 4648 },
  { canonicalId: 957, form: "ⲗⲓⲙⲏⲛ", removedId: 4907 },
  { canonicalId: 1007, form: "ⲙⲏ", removedId: 5039 },
  { canonicalId: 1204, form: "ⲟ", removedId: 5157 },
  { canonicalId: 1410, form: "ⲥⲁⲛⲓⲥ", removedId: 5528 },
  { canonicalId: 1966, form: "ϣⲉⲩ", removedId: 3156 },
  { canonicalId: 2635, form: "ⲁⲙⲛⲁ", removedId: 3516 },
  { canonicalId: 5132, form: "ⲛⲟⲩⲥ", removedId: 2968 },
] as const;
const absorbedBoundaryVariantExamples = [
  { canonicalId: 126, form: "ⲥⲟⲩ", removedId: 5599 },
  {
    canonicalId: 4785,
    form: "ⲕⲱⲙⲟⲡⲟⲗⲓⲥ",
    removedId: 4869,
  },
] as const;
const absorbedGreekOneLetterVariantExamples = [
  { canonicalId: 3599, form: "ⲁⲡⲁⲅⲅⲉⲗⲓⲛ", removedId: 3601 },
  { canonicalId: 3798, form: "ⲃⲁⲥⲓⲗⲓⲁ", removedId: 3800 },
  { canonicalId: 4887, form: "ⲗⲓⲧⲟⲩⲣⲅⲓⲁ", removedId: 4913 },
  { canonicalId: 6025, form: "ⲭⲓⲣⲟⲅⲣⲁⲫⲟⲛ", removedId: 6038 },
] as const;
const absorbedEgyptianOneLetterVariantExamples = [
  { canonicalId: 37, form: "ⲕⲱⲡ", removedId: 806 },
  { canonicalId: 193, form: "ϩⲣⲧⲉ", removedId: 2231 },
  { canonicalId: 285, form: "ϣⲁⲁⲃ", removedId: 1824 },
] as const;
const foldedRegularFeminineCounterpartExamples = [
  {
    feminineForm: "ⲟⲩⲣⲱ",
    parentId: 18,
  },
  {
    feminineForm: "ϣⲉⲣⲓ",
    parentId: 20,
  },
  {
    feminineForm: "ⲃⲱⲕⲓ",
    parentId: 550,
  },
] as const;
const independentGreekErPrefixComplexVerbExamples = [
  { baseId: 3348, complexId: 4146, form: "ⲉⲣⲁⲅⲁⲡⲁⲛ" },
  { baseId: 4867, complexId: 4240, form: "ⲉⲣⲕⲱⲗⲩⲉⲓⲛ" },
  { baseId: 5522, complexId: 4300, form: "ⲉⲣⲥⲁⲗⲡⲓⲍⲉⲓⲛ" },
  { baseId: 6046, complexId: 4336, form: "ⲉⲣⲭⲟⲣⲉⲩⲉⲓⲛ" },
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
    ...entry.senses.flatMap((group) => [
      ...(group.meanings?.en ?? []),
      ...(group.meanings?.nl ?? []),
    ]),
    ...(entry.dialectMeanings ?? []).flatMap((meaning) => [
      ...(meaning.meanings?.en ?? []),
      ...(meaning.meanings?.nl ?? []),
    ]),
    ...(entry.genderedMeanings ?? []).flatMap((meaning) => [
      ...Object.values(meaning.meanings?.en ?? {}),
      ...Object.values(meaning.meanings?.nl ?? {}),
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

function findSense(
  entry: LexicalEntry | undefined,
  predicate: (sense: NonNullable<LexicalEntry["senses"]>[number]) => boolean,
) {
  return entry?.senses.find(predicate);
}

describe("dictionary dataset guardrails", () => {
  it("matches the dictionary schema", () => {
    const result = validateDictionaryEntries(readDictionaryPayload());

    expect(formatDictionaryValidationIssues(result.issues, 200)).toEqual([]);
  });

  it("keeps dialect and inflected-form keys within the configured dictionary sigla", () => {
    const dictionary = readDictionary();
    const allowedDialectCodes = new Set<string>(DICTIONARY_DIALECT_CODES);
    const unexpectedDialectKeys: Array<{ dialect: string; id: number }> = [];
    const unexpectedInflectedFormDialectKeys: Array<{
      dialect: string;
      id: number;
    }> = [];

    for (const entry of dictionary) {
      for (const dialect of Object.keys(entry.dialects)) {
        if (!allowedDialectCodes.has(dialect)) {
          unexpectedDialectKeys.push({ dialect, id: entry.id });
        }
      }

      for (const inflectedForm of flattenInflections(entry)) {
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

  it("omits plural-prefixed headword artifacts from the dataset", () => {
    const dictionary = readDictionary();
    const pluralPrefixedHeadwordEntries = dictionary
      .filter((entry) => pluralPrefixedHeadwordPattern.test(entry.headword))
      .map((entry) => ({
        headword: entry.headword,
        id: entry.id,
      }));

    expect(pluralPrefixedHeadwordEntries).toEqual([]);
  });

  it("requires explicit etymology values on every entry", () => {
    const dictionary = readDictionary();
    const invalidEtymologyEntries = dictionary.flatMap((entry) =>
      typeof entry.etym !== "string" || !allowedEtymologies.has(entry.etym)
        ? [{ etym: entry.etym, id: entry.id }]
        : [],
    );

    expect(invalidEtymologyEntries).toEqual([]);
    expect(dictionary.filter((entry) => entry.etym === "Unknown")).toEqual([
      expect.objectContaining({ headword: "ϫⲗⲉ", id: 7166 }),
      expect.objectContaining({
        headword: "ϯϫⲣⲉ ⲛϩⲏⲧ",
        id: 7348,
      }),
    ]);
  });

  it("omits empty Greek arrays", () => {
    const dictionary = readDictionary();
    const invalidGreekEntries = dictionary
      .filter(
        (entry) => "greek" in entry && !isNonEmptyStringArray(entry.greek),
      )
      .map((entry) => entry.id);

    expect(invalidGreekEntries).toEqual([]);
  });

  it("keeps structured senses annotated with structured grammar", () => {
    const dictionary = readDictionary();
    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));

    expect(
      findSense(entriesById.get(2), (sense) => sense.grammar.valency === "INTR")
        ?.grammar,
    ).toEqual({ pos: "V", valency: "INTR" });
    expect(
      findSense(entriesById.get(25), (sense) => sense.grammar.pos === "N")
        ?.grammar,
    ).toEqual({ gender: "M", pos: "N" });
    expect(
      findSense(entriesById.get(100), (sense) => sense.grammar.number === "PL")
        ?.grammar,
    ).toEqual({ number: "PL", pos: "N" });
    expect(
      findSense(
        entriesById.get(2639),
        (sense) => sense.grammar.polarity === "NEG",
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
    const souEntry = dictionary.find((entry) => entry.id === 126);

    expect(
      findSense(souEntry, (group) => group.grammar.pos === "V"),
    ).toBeDefined();
    const komopolisEntry = dictionary.find((entry) => entry.id === 4785);

    expect(
      findSense(komopolisEntry, (group) => group.grammar.pos === "N"),
    ).toMatchObject({ grammar: { gender: "BOTH", pos: "N" } });
    expect(
      findSense(
        dictionary.find((entry) => entry.id === 5345),
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

      expect(parentEntry ? flattenInflections(parentEntry) : []).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            form: example.feminineForm,
            kind: "feminine",
          }),
        ]),
      );
    }
    expect(entriesById.get(1698)).toMatchObject({
      headword: "ⲟⲩⲣⲱ",
    });
    expect(
      findSense(entriesById.get(1698), (group) =>
        Boolean(group.meanings?.en?.includes("bean")),
      ),
    ).toMatchObject({
      meanings: { en: ["bean"], nl: ["boon"] },
      grammar: { gender: "M", pos: "N" },
    });
  });

  it("keeps Bohairic er-prefix Greek complex verbs as independent entries", () => {
    const dictionary = readDictionary();
    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));

    for (const example of independentGreekErPrefixComplexVerbExamples) {
      expect(entriesById.get(example.baseId)).toMatchObject({
        etym: "Gr",
      });
      expect(entriesById.get(example.complexId)).toMatchObject({
        etym: "Gr",
        headword: example.form,
      });
      expect(
        findSense(
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
        flattenInflections(entry).filter((form) => form.kind === "plural")
          .length,
      0,
    );

    expect(structuredPluralFormCount).toBe(598);
  });

  it("keeps number-marked meaning prose in structured sense groups", () => {
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

    expect(searchIds("ⲁϩⲱⲱⲣ")).toContain(7);
    expect(searchIds("ⲟⲩⲣⲱⲟⲩ")).toContain(18);
    expect(searchIds("ⲉⲃⲓⲁⲓⲕ")).toContain(550);
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
    }
    expect(searchIds("ⲟⲩⲣⲱ")).toContain(1698);
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
      id: number;
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
        flattenInflections(entry).filter((form) => form.kind === "imperative")
          .length,
      0,
    );
    const parentEntry = dictionary.find((entry) => entry.id === 2);

    expect(entriesWithLegacyImperativeFields).toEqual([]);
    expect(imperativeFormCount).toBe(84);
    expect(parentEntry?.dialects.B).toMatchObject({
      absolute: "ϯ",
      variants: {
        pronominal: ["ⲧⲏⲓⲧ="],
      },
    });
    expect(parentEntry ? flattenInflections(parentEntry) : []).toEqual(
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
          flattenInflections(entry).some((form) => form.kind === "feminine"),
      )
      .map((entry) => entry.id)
      .sort((left, right) => left - right);

    expect(masculineEntriesWithFeminineForms).toEqual([18, 20, 550]);
    expect(
      getGenderedHeadingParts(entriesById.get(18)!, "B").map(
        (part) => `${part.spelling} ${part.marker}`,
      ),
    ).toEqual(["ⲟⲩⲣⲟ m", "ⲟⲩⲣⲱ f", "ⲟⲩⲣⲱⲟⲩ pl"]);
    expect(
      getGenderedHeadingParts(entriesById.get(20)!, "B").map(
        (part) => `${part.spelling} ${part.marker}`,
      ),
    ).toEqual(["ϣⲏⲣⲓ ϣⲟⲩ- m", "ϣⲉⲣⲓ f"]);
    expect(entriesById.get(20)?.genderedMeanings).toEqual([
      {
        meanings: {
          en: {
            f: "daughter",
            m: "son, child",
          },
          nl: {
            f: "dochter",
            m: "zoon, kind",
          },
        },
      },
    ]);
    expect(entriesById.get(18)?.genderedMeanings).toEqual([
      {
        meanings: {
          en: {
            f: "queen",
            m: "king",
            pl: "royals",
          },
          nl: {
            f: "koningin",
            m: "koning",
            pl: "koninklijken",
          },
        },
      },
    ]);
    expect(entriesById.get(17)?.genderedMeanings).toEqual([
      {
        meanings: {
          en: {
            f: "lady",
            m: "lord",
            pl: "nobles",
          },
          nl: {
            f: "dame",
            m: "heer",
            pl: "edelen",
          },
        },
      },
    ]);
    expect(entriesById.get(18)?.senses.map((group) => group.grammar)).toEqual([
      { gender: "M", pos: "N" },
      { pos: "ADJ" },
    ]);
    expect(
      findSense(entriesById.get(18), (group) => group.grammar.pos === "ADJ")
        ?.meanings?.en,
    ).toEqual(["royal"]);
    expect(entriesById.get(17)?.senses.map((group) => group.grammar)).toEqual([
      { gender: "BOTH", pos: "N" },
      { pos: "ADJ" },
    ]);
    expect(
      findSense(entriesById.get(17), (group) => group.grammar.pos === "ADJ")
        ?.meanings?.en,
    ).toEqual(["noble"]);
    expect(entriesById.get(550)?.senses).toEqual([
      { grammar: { gender: "M", pos: "N" } },
    ]);
    expect(
      getGenderedHeadingParts(entriesById.get(550)!, "B").map(
        (part) => `${part.spelling} ${part.marker}`,
      ),
    ).toEqual(["ⲃⲱⲕ m", "ⲃⲱⲕⲓ f", "ⲉⲃⲓⲁⲓⲕ pl"]);
    expect(entriesById.get(5345)).toMatchObject({
      headword: "ⲡⲏⲣⲁ",
      senses: [
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
      dictionary.find((entry) => entry.id === 493)?.dialects.M,
    ).toMatchObject({
      absolute: "ⲁⲛⲁⲕ",
      nominal: "ⲁⲛⲕ-",
    });
    const oxyrhynchiteFenceEntry = dictionary.find(
      (entry) => entry.id === 7166,
    );

    expect(oxyrhynchiteFenceEntry).toMatchObject({
      dialects: {
        M: {
          absolute: "ϫⲗⲉ",
        },
      },
    });
    expect(
      findSense(oxyrhynchiteFenceEntry, (group) =>
        Boolean(group.meanings?.en?.includes("fence")),
      ),
    ).toMatchObject({
      meanings: { en: ["fence"], nl: ["omheining"] },
      grammar: { pos: "N" },
    });
  });

  it("stores construct participles as tilde-marked forms outside nominal state", () => {
    const dictionary = readDictionary();
    const invalidConstructParticiples: Array<{
      dialect: string;
      form: string;
      id: number;
    }> = [];
    const secondaryCanonicalConstructParticiples: Array<{
      dialect: string;
      forms: string[];
      id: number;
    }> = [];
    const nominalConstructParticiples: Array<{
      dialect: string;
      form: string;
      id: number;
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

        if ((forms.participles?.length ?? 0) > 1) {
          secondaryCanonicalConstructParticiples.push({
            dialect,
            forms: forms.participles ?? [],
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
      dictionary.find((entry) => entry.id === 130)?.dialects.B,
    ).toMatchObject({
      nominal: "ϭⲓ-",
      participles: ["ϭⲁⲓ~"],
      pronominal: "ϭⲓⲧ=",
      stative: "ϭⲏⲟⲩ†",
      variants: {
        constructParticiples: ["ϭⲁⲩ~"],
      },
    });
  });

  it("validates distinct construct participle compound entries", () => {
    const dictionary = readDictionary();
    const rootIds = new Set(dictionary.map((entry) => entry.id));
    const malformedCompounds: Array<{
      headword: string;
      id: number;
      reason: string;
    }> = [];

    const compoundEntries = dictionary.filter(
      (entry) => entry.root_id !== undefined,
    );

    for (const entry of compoundEntries) {
      if (!rootIds.has(entry.root_id!)) {
        malformedCompounds.push({
          headword: entry.headword,
          id: entry.id,
          reason: "missing root",
        });
      }

      if (!entry.senses.some((sense) => sense.grammar.pos === "N")) {
        malformedCompounds.push({
          headword: entry.headword,
          id: entry.id,
          reason: "missing noun sense",
        });
      }
    }

    expect(malformedCompounds).toEqual([]);
    expect(compoundEntries.length).toBeGreaterThanOrEqual(260);
  });

  it("keeps sense gloss arrays populated when present", () => {
    const dictionary = readDictionary();

    const malformedSenses = dictionary.flatMap((entry) =>
      entry.senses.flatMap((sense, senseIndex) =>
        (
          [
            ["meanings.en", sense.meanings?.en],
            ["meanings.nl", sense.meanings?.nl],
          ] as const
        ).flatMap(([field, values]) =>
          values === undefined || isNonEmptyStringArray(values)
            ? []
            : [{ field, id: entry.id, senseIndex }],
        ),
      ),
    );

    expect(malformedSenses).toEqual([]);
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
        id: 361,
        dialect: "B",
        nominal: "ⳳⲉⲛ-",
        pronominal: "ⲛ̀ⳳⲏⲧ=",
      },
      {
        id: 892,
        dialect: "B",
        nominal: "ⲛⲉⲙ-",
        pronominal: "ⲛⲉⲙⲁ=",
      },
      {
        id: 1713,
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
