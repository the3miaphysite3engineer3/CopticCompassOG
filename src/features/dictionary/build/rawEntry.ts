import { normalizeDialectKey } from "../config.ts";

import type { PartOfSpeech } from "../config.ts";
import type { DialectForms, LexicalEntry, LexicalGender } from "../types.ts";

interface DictionarySourceRow {
  word: string;
  meaning: string;
}

const nounMeaningLeadIns = ["f ", "m "];

export function stripSourceHtml(value: string) {
  return value.replace(/<[^>]+>/g, "");
}

/**
 * Infers the typed part of speech from the shorthand prefixes used in the
 * source spreadsheet's meaning column.
 */
function classifyPOS(meaning: string): PartOfSpeech {
  const normalizedMeaning = meaning.trim().toLowerCase();

  if (
    !normalizedMeaning ||
    normalizedMeaning.startsWith("meaning unknown") ||
    normalizedMeaning.startsWith("nn(?), meaning unknown")
  ) {
    return "UNKNOWN";
  }

  if (
    normalizedMeaning.startsWith("intr") ||
    normalizedMeaning.startsWith("tr") ||
    normalizedMeaning.startsWith("impers vb") ||
    normalizedMeaning.startsWith("impers") ||
    normalizedMeaning.startsWith("qual")
  ) {
    return "V";
  }

  if (
    normalizedMeaning.startsWith("as adj") ||
    normalizedMeaning.startsWith("nn as adj") ||
    normalizedMeaning.startsWith("nn or adj")
  ) {
    return "ADJ";
  }

  if (
    normalizedMeaning.startsWith("as adv") ||
    normalizedMeaning.startsWith("adv")
  ) {
    return "ADV";
  }

  if (
    normalizedMeaning.includes("conj") ||
    normalizedMeaning.startsWith("conjunction")
  ) {
    return "CONJ";
  }

  if (
    normalizedMeaning.startsWith("as prep") ||
    normalizedMeaning.startsWith("prep")
  ) {
    return "PREP";
  }

  if (
    normalizedMeaning.startsWith("interj") ||
    normalizedMeaning.startsWith("deprecatory interj")
  ) {
    return "INJ";
  }

  if (
    normalizedMeaning.startsWith("pron") ||
    normalizedMeaning.startsWith("pers pron") ||
    normalizedMeaning.startsWith("dem pron") ||
    normalizedMeaning.startsWith("rel pron")
  ) {
    return "OTHER";
  }

  if (
    normalizedMeaning.startsWith("verbal prefix") ||
    normalizedMeaning.startsWith("prefix") ||
    normalizedMeaning.startsWith("article") ||
    normalizedMeaning.startsWith("def art") ||
    normalizedMeaning.startsWith("indef art")
  ) {
    return "OTHER";
  }

  if (
    normalizedMeaning.startsWith("nn") ||
    normalizedMeaning.startsWith("name") ||
    nounMeaningLeadIns.some((leadIn) => normalizedMeaning.startsWith(leadIn))
  ) {
    return "N";
  }

  return "N";
}

function classifyNounGender(meaning: string, pos: PartOfSpeech): LexicalGender {
  const firstMeaningLine = meaning.trim().split("\n")[0]?.trim() ?? "";
  const loweredMeaning = meaning.toLowerCase();

  let gender: LexicalGender = "";

  if (/^f(\s|,|:|$)/.test(firstMeaningLine)) {
    gender = "F";
  } else if (/^m(\s|,|:|$)/.test(firstMeaningLine)) {
    gender = "M";
  } else if (/\bnn\s+f\b/.test(loweredMeaning)) {
    gender = "F";
  } else if (/\bnn\s+m\b/.test(loweredMeaning)) {
    gender = "M";
  } else if (
    /\bnn\b/.test(loweredMeaning) &&
    !/\bnn\s+[mf]\b/.test(loweredMeaning)
  ) {
    gender = "BOTH";
  }

  if (pos === "V" && gender === "BOTH") {
    return "M";
  }

  return gender;
}

function extractGreek(meaning: string): string[] {
  const matches = meaning.match(/\[(.*?)\]/g);

  if (!matches) {
    return [];
  }

  return matches.map((match) => match.slice(1, -1).trim());
}

function splitMeaningLines(meaning: string): string[] {
  return meaning
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function extractDialectsAndHeadword(wordRaw: string): {
  headword: string;
  dialects: Record<string, DialectForms>;
} {
  /**
   * Each parenthesized line carries one or more dialect sigla followed by the
   * form to store for that grammatical state.
   */
  const lines = wordRaw.split("\n");
  const dialectsObj: Record<string, DialectForms> = {};
  let primaryHeadword = "";

  for (const line of lines) {
    const parentheticalMatch = line.match(/^\(([^)]+)\)\s*(.*)/);

    if (!parentheticalMatch) {
      continue;
    }

    const dialectKeys = parentheticalMatch[1]
      .split(",")
      .map((dialect) => normalizeDialectKey(dialect));
    let wordTokens = parentheticalMatch[2].trim();

    wordTokens = wordTokens.replace(/\{.*?\}/g, "").trim();

    const forms = wordTokens
      .split(/,\s*/)
      .map((value) => value.trim())
      .filter(Boolean);
    let form = forms[0] ?? "";
    const absoluteVariants = forms.slice(1);

    if (!form) {
      continue;
    }

    let state: keyof DialectForms = "absolute";

    if (form.endsWith("-")) {
      state = "nominal";
    } else if (form.endsWith("=")) {
      state = "pronominal";
    } else if (form.endsWith("+") || form.endsWith("†")) {
      state = "stative";

      if (form.endsWith("+")) {
        form = `${form.slice(0, -1)}†`;
      }
    }

    if (state === "absolute" && !primaryHeadword) {
      primaryHeadword = form;
    }

    for (const dialectKey of dialectKeys) {
      if (!dialectsObj[dialectKey]) {
        dialectsObj[dialectKey] = {
          absolute: "",
          nominal: "",
          pronominal: "",
          stative: "",
        };
      }

      if (!dialectsObj[dialectKey][state]) {
        dialectsObj[dialectKey][state] = form;
      }

      if (state === "absolute" && absoluteVariants.length > 0) {
        const existingVariants = new Set(
          dialectsObj[dialectKey].absoluteVariants ?? [],
        );

        for (const variant of absoluteVariants) {
          existingVariants.add(variant);
        }

        dialectsObj[dialectKey].absoluteVariants = [...existingVariants];
      }
    }
  }

  if (!primaryHeadword) {
    primaryHeadword =
      wordRaw
        .split("\n")[0]
        ?.replace(/\{.*?\}/g, "")
        .replace(/^\(.*?\)\s*/, "")
        .split(",")[0]
        ?.trim() ?? "";
  }

  return { headword: primaryHeadword, dialects: dialectsObj };
}

export function buildLexicalEntryFromSourceRow(
  row: DictionarySourceRow,
  id: string,
): LexicalEntry | null {
  if (!row.word || !row.meaning) {
    return null;
  }

  const cleanWord = stripSourceHtml(row.word);
  const cleanMeaning = stripSourceHtml(row.meaning);
  const { headword, dialects } = extractDialectsAndHeadword(cleanWord);
  const pos = classifyPOS(cleanMeaning);

  return {
    id,
    headword,
    dialects,
    pos,
    gender: classifyNounGender(cleanMeaning, pos),
    english_meanings: splitMeaningLines(cleanMeaning),
    greek_equivalents: extractGreek(cleanMeaning),
    raw: {
      word: cleanWord,
      meaning: cleanMeaning,
    },
  };
}
