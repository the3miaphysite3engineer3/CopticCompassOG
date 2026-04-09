import fs from "node:fs";
import path from "node:path";

import { assertServerOnly } from "../../lib/server/assertServerOnly.ts";

import type { LexicalEntry } from "../../features/dictionary/types.ts";

assertServerOnly("src/content/grammar/dictionary-data.ts");

let dictionaryCache: LexicalEntry[] | null = null;

/**
 * Reads the generated dictionary snapshot for grammar-export enrichment
 * without depending on the app-side dictionary helper or path aliases.
 */
export function getGrammarDictionaryData(): LexicalEntry[] {
  if (dictionaryCache) {
    return dictionaryCache;
  }

  const filePath = path.join(process.cwd(), "public/data/dictionary.json");
  if (!fs.existsSync(filePath)) {
    dictionaryCache = [];
    return dictionaryCache;
  }

  dictionaryCache = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  ) as LexicalEntry[];
  return dictionaryCache;
}
