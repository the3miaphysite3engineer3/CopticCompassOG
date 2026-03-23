import type { LexicalEntry } from "../types.ts";
import { extractRelatedFormCandidates } from "../build/relatedForms.ts";
import {
  buildPromotedRelatedEntryDefinitionKey,
  getPromotedRelatedEntryDefinitionMap,
} from "./promotedRelatedEntries.ts";

export interface BohairicFemaleAuditItem {
  parentEntryId: string;
  parentHeadword: string;
  form: string;
  rawLine: string;
  status: "pending" | "promoted";
  promotedEntryId: string | null;
}

export function getBohairicFemaleAuditItems(
  dictionary: readonly LexicalEntry[],
): BohairicFemaleAuditItem[] {
  const definitionMap = getPromotedRelatedEntryDefinitionMap();

  return dictionary
    .filter((entry) => !entry.parentEntryId)
    .flatMap((entry) =>
      extractRelatedFormCandidates(entry)
        .filter(
          (candidate) =>
            candidate.dialect === "B" && candidate.relationLabel === "female",
        )
        .map((candidate) => {
          const definition = definitionMap.get(
            buildPromotedRelatedEntryDefinitionKey(candidate),
          );

          return {
            parentEntryId: candidate.parentEntryId,
            parentHeadword: candidate.parentHeadword,
            form: candidate.form,
            rawLine: candidate.rawLine,
            status: definition ? "promoted" : "pending",
            promotedEntryId: definition?.id ?? null,
          } satisfies BohairicFemaleAuditItem;
        }),
    )
    .sort((left, right) =>
      left.parentEntryId.localeCompare(right.parentEntryId) ||
      left.form.localeCompare(right.form),
    );
}
