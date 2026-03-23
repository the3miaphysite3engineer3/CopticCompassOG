import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createGrammarStaticExportFiles } from '../src/content/grammar/build.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function writeJsonFile(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  const outputRoot = path.resolve(__dirname, '../public/data');
  const grammarOutputRoot = path.join(outputRoot, 'grammar/v1');
  const files = createGrammarStaticExportFiles();

  fs.rmSync(grammarOutputRoot, { recursive: true, force: true });

  files.forEach((file) => {
    const absolutePath = path.join(outputRoot, file.outputPath);
    writeJsonFile(absolutePath, file.payload);
    console.log(`Wrote ${absolutePath}`);
  });

  console.log(`Successfully exported ${files.length} grammar data files to ${outputRoot}`);
}

main();
