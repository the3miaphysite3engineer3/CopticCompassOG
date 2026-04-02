import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { format } from "prettier";
import { createGrammarStaticExportFiles } from "../src/content/grammar/build.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function writeJsonFile(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const formattedJson = await format(JSON.stringify(payload), {
    parser: "json",
  });
  fs.writeFileSync(filePath, formattedJson);
}

async function main() {
  const outputRoot = path.resolve(__dirname, "../public/data");
  const grammarOutputRoot = path.join(outputRoot, "grammar/v1");
  const files = createGrammarStaticExportFiles();

  fs.rmSync(grammarOutputRoot, { recursive: true, force: true });

  for (const file of files) {
    const absolutePath = path.join(outputRoot, file.outputPath);
    await writeJsonFile(absolutePath, file.payload);
    console.log(`Wrote ${absolutePath}`);
  }

  console.log(
    `Successfully exported ${files.length} grammar data files to ${outputRoot}`,
  );
}

await main();
