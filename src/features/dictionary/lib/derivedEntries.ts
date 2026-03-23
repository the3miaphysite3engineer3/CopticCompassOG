import type { LexicalEntry } from "@/features/dictionary/types";
import { extractGreek } from "../build/rawEntry.ts";
import {
  loadCuratedDerivedEntryDefinitions,
  type CuratedDerivedEntryDefinition,
} from "./dictionarySourceConfig.ts";
import { validateDictionarySourceConfig } from "./dictionarySourceValidation.ts";
import {
  getPromotedRelatedEntries,
  getPromotedRelatedEntryDefinitions,
} from "./promotedRelatedEntries.ts";

export type DerivedDictionaryLocale = "en" | "nl";

function normalizeMeaningLine(line: string) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:f|m)\s*,\s*/i, "")
    .replace(/^female\s+/i, "")
    .trim();
}

function normalizeGreekEquivalent(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildPromotedMeaningLineSet(
  entry: LexicalEntry,
  locale: DerivedDictionaryLocale,
) {
  const promotedDefinitions = getPromotedRelatedEntryDefinitions().filter(
    (definition) => definition.parentEntryId === entry.id,
  );
  const removableMeaningLines = new Set<string>();

  for (const definition of promotedDefinitions) {
    const greekSuffix =
      definition.greekEquivalents && definition.greekEquivalents.length > 0
        ? ` [${definition.greekEquivalents.join(", ")}]`
        : "";

    for (const meaning of definition.meanings[locale]) {
      const line = `${meaning}${greekSuffix}`;
      removableMeaningLines.add(normalizeMeaningLine(line));
    }
  }

  return removableMeaningLines;
}

function buildPromotedGreekEquivalentSet(entry: LexicalEntry) {
  const promotedDefinitions = getPromotedRelatedEntryDefinitions().filter(
    (definition) => definition.parentEntryId === entry.id,
  );
  const removableGreekEquivalents = new Set<string>();

  for (const definition of promotedDefinitions) {
    const greekEquivalents = definition.greekEquivalents ?? [];

    if (greekEquivalents.length === 1) {
      removableGreekEquivalents.add(
        normalizeGreekEquivalent(greekEquivalents[0]),
      );
    } else if (greekEquivalents.length > 1) {
      removableGreekEquivalents.add(
        normalizeGreekEquivalent(greekEquivalents.join(", ")),
      );
    }
  }

  return removableGreekEquivalents;
}

function normalizeSourceEntryMeanings(
  entry: LexicalEntry,
  locale: DerivedDictionaryLocale,
) {
  if (entry.parentEntryId) {
    return entry;
  }

  const removableMeaningLines = buildPromotedMeaningLineSet(entry, locale);
  const removableGreekEquivalents = buildPromotedGreekEquivalentSet(entry);

  if (removableMeaningLines.size === 0) {
    return entry;
  }

  const normalizedMeaningLines = entry.english_meanings.filter(
    (meaningLine) => !removableMeaningLines.has(normalizeMeaningLine(meaningLine)),
  );

  if (
    normalizedMeaningLines.length === 0 ||
    normalizedMeaningLines.length === entry.english_meanings.length
  ) {
    return entry;
  }

  return {
    ...entry,
    english_meanings: normalizedMeaningLines,
    greek_equivalents:
      entry.greek_equivalents.length > 0
        ? entry.greek_equivalents.filter(
            (greekEquivalent) =>
              !removableGreekEquivalents.has(
                normalizeGreekEquivalent(greekEquivalent),
              ),
          )
        : extractGreek(normalizedMeaningLines.join("\n")),
  };
}

function materializeDerivedEntry(
  definition: CuratedDerivedEntryDefinition,
  locale: DerivedDictionaryLocale,
): LexicalEntry {
  return {
    id: definition.id,
    headword: definition.headword,
    dialects: definition.dialects,
    pos: definition.pos,
    gender: definition.gender,
    parentEntryId: definition.parentEntryId,
    relationType: definition.relationType,
    english_meanings: [...definition.meanings[locale]],
    greek_equivalents: [...definition.greekEquivalents],
    raw: definition.raw,
  };
}

export function getDerivedDictionaryEntries(
  locale: DerivedDictionaryLocale,
): LexicalEntry[] {
  return loadCuratedDerivedEntryDefinitions().map((definition) =>
    materializeDerivedEntry(definition, locale),
  );
}

export function applyDerivedDictionaryEntries(
  dictionary: readonly LexicalEntry[],
  locale: DerivedDictionaryLocale,
): LexicalEntry[] {
  validateDictionarySourceConfig(dictionary);
  const normalizedDictionary = dictionary.map((entry) =>
    normalizeSourceEntryMeanings(entry, locale),
  );

  const derivedEntries = [
    ...getDerivedDictionaryEntries(locale),
    ...getPromotedRelatedEntries(normalizedDictionary, locale),
  ];
  const derivedIds = new Set(derivedEntries.map((entry) => entry.id));

  return [
    ...normalizedDictionary.filter((entry) => !derivedIds.has(entry.id)),
    ...derivedEntries,
  ];
}
