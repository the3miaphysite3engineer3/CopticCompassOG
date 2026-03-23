import type { LexicalEntry } from "../types.ts";
import { normalizeDialectKey } from "../config.ts";
import { stripSourceHtml } from "./rawEntry.ts";

export type RelatedFormLabel =
  | "female"
  | "imperative"
  | "male"
  | "noun male"
  | "plural";

export interface RelatedFormCandidate {
  parentEntryId: string;
  parentHeadword: string;
  relationLabel: RelatedFormLabel;
  dialect: string;
  form: string;
  rawLine: string;
}

const supportedRelatedFormLabels = new Set<RelatedFormLabel>([
  "female",
  "imperative",
  "male",
  "noun male",
  "plural",
]);

export function extractRelatedFormCandidates(
  entry: Pick<LexicalEntry, "id" | "headword" | "raw">,
): RelatedFormCandidate[] {
  const lines = stripSourceHtml(entry.raw.word).split(/\r?\n/);
  const candidates: RelatedFormCandidate[] = [];

  for (const rawLine of lines) {
    const cleanedLine = rawLine.trim();

    if (!cleanedLine) {
      continue;
    }

    const match = cleanedLine.match(/^\(([^)]+)\)\s*([a-z ]+):\s*(.+)$/i);

    if (!match) {
      continue;
    }

    const relationLabel = match[2].trim().toLowerCase() as RelatedFormLabel;

    if (!supportedRelatedFormLabels.has(relationLabel)) {
      continue;
    }

    const dialects = match[1]
      .split(",")
      .map((dialect) => normalizeDialectKey(dialect));
    const forms = match[3]
      .replace(/\{.*?\}/g, "")
      .split(/,\s*/)
      .map((form) => form.trim())
      .filter(Boolean);

    for (const dialect of dialects) {
      for (const form of forms) {
        candidates.push({
          parentEntryId: entry.id,
          parentHeadword: entry.headword,
          relationLabel,
          dialect,
          form,
          rawLine: cleanedLine,
        });
      }
    }
  }

  return candidates;
}
