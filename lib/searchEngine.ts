import type { LexicalEntry } from "../src/lib/dictionaryTypes";

export interface PreparedLexicalEntry {
  entry: LexicalEntry;
  normalizedHeadword: string;
  normalizedDialectForms: string;
  englishSearchText: string;
  greekSearchText: string;
}

/**
 * Strips Coptic combining characters (supralinear strokes, jinkims, diaereses)
 * so that we can do broad fuzzy matching.
 */
export function normalizeCoptic(text: string): string {
  if (!text) return "";
  // NFD decomposition separates base characters from combining characters
  // Then we strip the combining characters range.
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f\uFE20-\uFE2F\u0483-\u0489]/g, "")
    .toLowerCase()
    .trim();
}

export function prepareDictionaryForSearch(dictionary: LexicalEntry[]): PreparedLexicalEntry[] {
  return dictionary.map((entry) => {
    const dialectForms = Object.values(entry.dialects)
      .flatMap((forms) => [forms.absolute, forms.nominal, forms.pronominal, forms.stative])
      .filter(Boolean)
      .join(" ");

    return {
      entry,
      normalizedHeadword: normalizeCoptic(entry.headword),
      normalizedDialectForms: normalizeCoptic(dialectForms),
      englishSearchText: entry.english_meanings.join(" ").toLowerCase(),
      greekSearchText: entry.greek_equivalents.join(" ").toLowerCase(),
    };
  });
}

export function searchPreparedDictionary(query: string, dictionary: PreparedLexicalEntry[]): LexicalEntry[] {
  if (!query || query.trim().length === 0) return [];

  const plainQuery = query.toLowerCase().trim();
  const normalizedQuery = normalizeCoptic(query);

  return dictionary
    .filter((entry) => {
      if (entry.normalizedHeadword.includes(normalizedQuery)) return true;
      if (entry.normalizedDialectForms.includes(normalizedQuery)) return true;
      if (entry.englishSearchText.includes(plainQuery)) return true;
      if (entry.greekSearchText.includes(plainQuery)) return true;
      return false;
    })
    .map((entry) => entry.entry);
}

/**
 * Perform a search on the dictionary array
 */
export function searchDictionary(query: string, dictionary: LexicalEntry[]): LexicalEntry[] {
  return searchPreparedDictionary(query, prepareDictionaryForSearch(dictionary));
}
