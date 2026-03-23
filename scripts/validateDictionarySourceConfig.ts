import fs from "fs";
import path from "path";
import type { LexicalEntry } from "../src/features/dictionary/types.ts";
import { validateDictionarySourceConfig } from "../src/features/dictionary/lib/dictionarySourceValidation.ts";

const dictionaryPath = path.join(process.cwd(), "public/data/dictionary.json");

const dictionary = JSON.parse(
  fs.readFileSync(dictionaryPath, "utf8"),
) as LexicalEntry[];
const summary = validateDictionarySourceConfig(dictionary);

console.log(
  `Validated dictionary source config against ${summary.sourceEntries} source entries.`,
);
console.log(
  `Curated definitions: ${summary.curatedDefinitions}; promoted definitions: ${summary.promotedDefinitions}.`,
);
