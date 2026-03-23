import { extractRelatedFormCandidates } from "../build/relatedForms.ts";
import type {
  DictionaryDialectFormsMap,
  LexicalEntry,
} from "../types.ts";
import type { DerivedDictionaryLocale } from "./derivedEntries.ts";
import {
  loadPromotedRelatedEntryDefinitions,
  type PromotedRelatedEntryDefinition,
} from "./dictionarySourceConfig.ts";

export function buildPromotedRelatedEntryDefinitionKey(definition: {
  parentEntryId: string;
  relationLabel: string;
  dialect: string;
  form: string;
}) {
  return [
    definition.parentEntryId,
    definition.relationLabel,
    definition.dialect,
    definition.form,
  ].join("|");
}

export function getPromotedRelatedEntryDefinitions() {
  return loadPromotedRelatedEntryDefinitions();
}

export function getPromotedRelatedEntryDefinitionMap() {
  return new Map(
    loadPromotedRelatedEntryDefinitions().map((definition) => [
      buildPromotedRelatedEntryDefinitionKey(definition),
      definition,
    ]),
  );
}

function materializePromotedRelatedEntry(
  parentEntry: LexicalEntry,
  definition: PromotedRelatedEntryDefinition,
  locale: DerivedDictionaryLocale,
): LexicalEntry {
  const dialects: DictionaryDialectFormsMap = {
    [definition.dialect]: {
      absolute: definition.form,
      nominal: "",
      pronominal: "",
      stative: "",
    },
  } as DictionaryDialectFormsMap;

  return {
    id: definition.id,
    headword: definition.headword ?? definition.form,
    dialects,
    pos: definition.pos ?? parentEntry.pos,
    gender: definition.gender ?? parentEntry.gender,
    parentEntryId: parentEntry.id,
    relationType: definition.relationType ?? "derived-subentry",
    english_meanings: [...definition.meanings[locale]],
    greek_equivalents: [...(definition.greekEquivalents ?? [])],
    raw: {
      word: `(${definition.dialect}) ${definition.relationLabel}: ${definition.form}`,
      meaning: definition.meanings[locale].join("; "),
    },
  };
}

export function getPromotedRelatedEntries(
  dictionary: readonly LexicalEntry[],
  locale: DerivedDictionaryLocale,
): LexicalEntry[] {
  const definitionMap = getPromotedRelatedEntryDefinitionMap();

  return dictionary
    .filter((entry) => !entry.parentEntryId)
    .flatMap((entry) =>
    extractRelatedFormCandidates(entry).flatMap((candidate) => {
      const definition = definitionMap.get(
        buildPromotedRelatedEntryDefinitionKey(candidate),
      );

      if (!definition) {
        return [];
      }

      return [materializePromotedRelatedEntry(entry, definition, locale)];
    }),
  );
}
