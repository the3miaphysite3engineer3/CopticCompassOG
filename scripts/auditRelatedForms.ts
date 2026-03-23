import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { LexicalEntry } from "../src/features/dictionary/types.ts";
import { getBohairicFemaleAuditItems } from "../src/features/dictionary/lib/relatedEntryAudit.ts";
import { validateDictionarySourceConfig } from "../src/features/dictionary/lib/dictionarySourceValidation.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const dictionaryPath = path.join(__dirname, "../public/data/dictionary.json");
  const dictionary = JSON.parse(
    fs.readFileSync(dictionaryPath, "utf8"),
  ) as LexicalEntry[];
  validateDictionarySourceConfig(dictionary);
  const auditItems = getBohairicFemaleAuditItems(dictionary);
  const promoted = auditItems.filter((item) => item.status === "promoted");
  const pending = auditItems.filter((item) => item.status === "pending");

  console.log(`Bohairic female candidates: ${auditItems.length}`);
  console.log(`Promoted: ${promoted.length}`);
  console.log(`Pending: ${pending.length}`);

  if (pending.length === 0) {
    return;
  }

  console.log("\nPending candidates:");

  for (const item of pending) {
    console.log(
      `- ${item.parentEntryId} ${item.parentHeadword} -> ${item.form} | ${item.rawLine}`,
    );
  }
}

main();
