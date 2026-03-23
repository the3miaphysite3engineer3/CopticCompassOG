import type { LexicalEntry } from "../types.ts";
import { extractRelatedFormCandidates } from "../build/relatedForms.ts";
import {
  loadCuratedDerivedEntryDefinitions,
  loadPromotedRelatedEntryDefinitions,
} from "./dictionarySourceConfig.ts";
import { buildPromotedRelatedEntryDefinitionKey } from "./promotedRelatedEntries.ts";

export interface DictionarySourceValidationSummary {
  sourceEntries: number;
  curatedDefinitions: number;
  promotedDefinitions: number;
}

function getSourceEntries(dictionary: readonly LexicalEntry[]) {
  return dictionary.filter((entry) => !entry.parentEntryId);
}

export function validateDictionarySourceConfig(
  dictionary: readonly LexicalEntry[],
): DictionarySourceValidationSummary {
  const sourceEntries = getSourceEntries(dictionary);
  const sourceEntryIds = new Set(sourceEntries.map((entry) => entry.id));
  const curatedDefinitions = loadCuratedDerivedEntryDefinitions();
  const promotedDefinitions = loadPromotedRelatedEntryDefinitions();
  const configuredIds = new Map<string, string>();
  const promotedDefinitionKeys = new Set<string>();

  for (const definition of curatedDefinitions) {
    if (configuredIds.has(definition.id)) {
      throw new Error(
        `Duplicate configured dictionary id "${definition.id}" in ${configuredIds.get(definition.id)} and master-dictionary.json.curatedDerivedEntries`,
      );
    }

    configuredIds.set(definition.id, "master-dictionary.json.curatedDerivedEntries");

    if (!sourceEntryIds.has(definition.parentEntryId)) {
      throw new Error(
        `Curated derived entry "${definition.id}" references missing parent "${definition.parentEntryId}"`,
      );
    }
  }

  for (const definition of promotedDefinitions) {
    if (configuredIds.has(definition.id)) {
      throw new Error(
        `Duplicate configured dictionary id "${definition.id}" in ${configuredIds.get(definition.id)} and master-dictionary.json.promotedRelatedEntries`,
      );
    }

    configuredIds.set(
      definition.id,
      "master-dictionary.json.promotedRelatedEntries",
    );

    if (!sourceEntryIds.has(definition.parentEntryId)) {
      throw new Error(
        `Promoted related entry "${definition.id}" references missing parent "${definition.parentEntryId}"`,
      );
    }

    const definitionKey = buildPromotedRelatedEntryDefinitionKey(definition);

    if (promotedDefinitionKeys.has(definitionKey)) {
      throw new Error(
        `Duplicate promoted related definition key "${definitionKey}" in master-dictionary.json.promotedRelatedEntries`,
      );
    }

    promotedDefinitionKeys.add(definitionKey);

    const parentEntry = sourceEntries.find(
      (entry) => entry.id === definition.parentEntryId,
    );

    if (!parentEntry) {
      throw new Error(
        `Promoted related entry "${definition.id}" parent "${definition.parentEntryId}" could not be loaded`,
      );
    }

    const hasMatchingSourceCandidate = extractRelatedFormCandidates(parentEntry).some(
      (candidate) =>
        buildPromotedRelatedEntryDefinitionKey(candidate) === definitionKey,
    );

    if (!hasMatchingSourceCandidate) {
      throw new Error(
        `Promoted related entry "${definition.id}" does not match any source candidate on parent "${definition.parentEntryId}"`,
      );
    }
  }

  for (const entry of sourceEntries) {
    if (configuredIds.has(entry.id)) {
      throw new Error(
        `Configured dictionary id "${entry.id}" collides with an existing source entry id`,
      );
    }
  }

  return {
    sourceEntries: sourceEntries.length,
    curatedDefinitions: curatedDefinitions.length,
    promotedDefinitions: promotedDefinitions.length,
  };
}
