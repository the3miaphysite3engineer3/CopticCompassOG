import fs from "fs";
import path from "path";
import type { LexicalEntry } from "@/features/dictionary/types";

export function getDictionary(): LexicalEntry[] {
  const filePath = path.join(process.cwd(), "public/data/dictionary.json");

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents) as LexicalEntry[];
}

export function getDictionaryEntryById(
  id: string,
  dictionary: readonly LexicalEntry[] = getDictionary(),
) {
  return dictionary.find((entry) => entry.id === id) ?? null;
}

export function getDictionaryEntryRelations(
  entry: LexicalEntry,
  dictionary: readonly LexicalEntry[] = getDictionary(),
) {
  const parentEntry = entry.parentEntryId
    ? getDictionaryEntryById(entry.parentEntryId, dictionary)
    : null;
  const relatedEntries = entry.parentEntryId
    ? dictionary.filter(
        (candidate) =>
          candidate.parentEntryId === entry.parentEntryId &&
          candidate.id !== entry.id,
      )
    : dictionary.filter((candidate) => candidate.parentEntryId === entry.id);

  return {
    parentEntry,
    relatedEntries: [...relatedEntries].sort((left, right) =>
      left.headword.localeCompare(right.headword),
    ),
  };
}
