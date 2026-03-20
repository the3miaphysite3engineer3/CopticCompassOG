import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { DialectForms, LexicalEntry } from '../src/lib/dictionaryTypes.ts';
import { normalizeDialectKey } from '../src/lib/dialects.ts';

export interface LegacyLexicalEntry {
  id: string;
  headword: string;
  dialects: Record<string, string>;
  pos: string;
  gender: string;
  english_meanings: string[];
  greek_equivalents: string[];
  raw: {
    word: string;
    meaning: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractDialectsAndHeadword(wordRaw: string): { headword: string, dialects: Record<string, DialectForms> } {
  const lines = wordRaw.split('\n');
  const dialectsObj: Record<string, DialectForms> = {};
  let primaryHeadword = '';

  for (const line of lines) {
    const parentheticalMatch = line.match(/^\(([^)]+)\)\s*(.*)/);
    if (parentheticalMatch) {
      const dialectKeys = parentheticalMatch[1].split(',').map((d) => normalizeDialectKey(d));
      let wordTokens = parentheticalMatch[2].trim();
      
      wordTokens = wordTokens.replace(/\{.*?\}/g, '').trim();

      // We only take the first explicit token string for the state
      let form = wordTokens.split(/,\s*/)[0].trim();
      if (!form) continue;

      let state: keyof DialectForms = 'absolute';
      if (form.endsWith('-')) {
        state = 'nominal';
      } else if (form.endsWith('=')) {
        state = 'pronominal';
      } else if (form.endsWith('+') || form.endsWith('†')) {
        state = 'stative';
        if (form.endsWith('+')) form = form.slice(0, -1) + '†';
      }

      if (state === 'absolute' && !primaryHeadword) primaryHeadword = form;
      
      dialectKeys.forEach(dk => {
        if (!dialectsObj[dk]) {
          dialectsObj[dk] = { absolute: '', nominal: '', pronominal: '', stative: '' };
        }
        if (!dialectsObj[dk][state]) {
          dialectsObj[dk][state] = form;
        }
      });
    }
  }

  if (!primaryHeadword) {
    primaryHeadword = wordRaw.split('\n')[0].replace(/\{.*?\}/g, '').replace(/^\(.*?\)\s*/, '').split(',')[0].trim();
  }

  return { headword: primaryHeadword, dialects: dialectsObj };
}

function main() {
  const dictionaryPaths = [
    path.join(__dirname, "../public/data/dictionary.json"),
    path.join(__dirname, "../public/data/woordenboek.json"),
  ];

  for (const dictionaryPath of dictionaryPaths) {
    console.log(`Reading existing dictionary from ${dictionaryPath}...`);

    const rawData = fs.readFileSync(dictionaryPath, "utf8");
    const legacyEntries: LegacyLexicalEntry[] = JSON.parse(rawData);

    const newEntries: LexicalEntry[] = legacyEntries.map((entry) => {
      const { headword, dialects } = extractDialectsAndHeadword(entry.raw.word);
      return {
        ...entry,
        headword,
        dialects,
      };
    });

    fs.writeFileSync(dictionaryPath, JSON.stringify(newEntries, null, 2));
    console.log(`Successfully migrated ${newEntries.length} entries to their exact grammatical bindings!`);
  }
}

main();
