import { normalizeDialectKey } from "../config.ts";

import type { PartOfSpeech } from "../config.ts";
import type { DialectForms, LexicalEntry, LexicalGender } from "../types.ts";

interface DictionarySourceRow {
  word: string;
  meaning: string;
}

const nounMeaningLeadIns = ["f ", "m "];
const CONSTRUCT_PARTICIPLE_ABBREVIATION_REGEX = /\bp\s*\.?\s*c\b\.?/gi;
const MEANING_GRAMMAR_LABEL_PUNCTUATION_REGEX =
  /\b(pc|impers vb|imperative|adjective|auxil|intr|qual|conj|prep|advb|adj|adv|tr|refl|suff|pref|vb|nn|pron|art|int\.?)(\s*\([^)]*\))?[:,]([ \t]*)/gi;
const MEANING_DIALECT_SIGLA_LIST_REGEX =
  /\b(?:Fb|Sa|Sf|Sl|sA|NH|A|B|F|L|O|S)(?:\s*,\s*(?:Fb|Sa|Sf|Sl|sA|NH|A|B|F|L|O|S))+\b/g;
const MEANING_DIALECT_SIGLA_TRAILING_COMMA_REGEX =
  /\b((?:Fb|Sa|Sf|Sl|A|B|F|L|O|S)+),([ \t]+)/g;
const MEANING_DIALECT_SIGLUM_ORDER = [
  "A",
  "B",
  "F",
  "Fb",
  "L",
  "NH",
  "O",
  "S",
  "Sa",
  "Sf",
  "Sl",
  "sA",
] as const;

function normalizeMeaningDialectSiglum(value: string) {
  if (value === "sA") {
    return "L";
  }

  if (value === "NH") {
    return "Sl";
  }

  return value;
}

export function stripSourceHtml(value: string) {
  return value.replace(/<[^>]+>/g, "");
}

/**
 * Standardizes the construct participle abbreviation used in imported
 * dictionary rows.
 */
export function normalizeConstructParticipleAbbreviation(value: string) {
  return value
    .replace(CONSTRUCT_PARTICIPLE_ABBREVIATION_REGEX, "pc")
    .replace(/\bpc\s{2,}/g, "pc ");
}

/**
 * Compacts comma-separated dialect sigla that appear in meaning glosses.
 */
export function normalizeMeaningDialectSigla(value: string) {
  return value.replace(MEANING_DIALECT_SIGLA_LIST_REGEX, (match) => {
    const sigla = new Set(
      match
        .split(/\s*,\s*/)
        .map((siglum) => normalizeMeaningDialectSiglum(siglum)),
    );

    return [...sigla]
      .sort(
        (left, right) =>
          MEANING_DIALECT_SIGLUM_ORDER.indexOf(
            left as (typeof MEANING_DIALECT_SIGLUM_ORDER)[number],
          ) -
          MEANING_DIALECT_SIGLUM_ORDER.indexOf(
            right as (typeof MEANING_DIALECT_SIGLUM_ORDER)[number],
          ),
      )
      .join("");
  });
}

/**
 * Removes visual punctuation after imported grammar labels and dialect sigla.
 */
export function normalizeMeaningPunctuation(value: string) {
  return value
    .replace(
      MEANING_GRAMMAR_LABEL_PUNCTUATION_REGEX,
      (_match, label: string, qualifier: string | undefined, spacing: string) =>
        `${label}${qualifier ?? ""}${spacing ? " " : ""}`,
    )
    .replace(MEANING_DIALECT_SIGLA_TRAILING_COMMA_REGEX, "$1 ");
}

function toConstructParticipleForm(value: string) {
  const cleaned = value
    .trim()
    .replace(/\{.*?\}~?/g, "")
    .replace(/^pc\b[:,.]?\s*/i, "")
    .replace(/^\(\?\)\s*/, "")
    .replace(/\s*\(\?\)\s*$/, "")
    .replace(/\s*&c\.?\s*$/i, "")
    .replace(/[-=]\s*~$/, "~")
    .replace(/\s+~/g, "~")
    .trim();

  if (!cleaned) {
    return "";
  }

  if (cleaned.endsWith("~")) {
    return cleaned;
  }

  if (cleaned.endsWith("-") || cleaned.endsWith("=")) {
    return `${cleaned.slice(0, -1)}~`;
  }

  return `${cleaned}~`;
}

function transformConstructParticipleLineForms(value: string) {
  return value
    .split(/,\s*/)
    .map((part) => {
      const noteMatch = part.match(/(\s*\{.*\}\s*)$/);
      const note = noteMatch ? noteMatch[1] : "";
      const core = noteMatch ? part.slice(0, -note.length) : part;

      return `${toConstructParticipleForm(core)}${note}`.trim();
    })
    .filter(Boolean)
    .join(", ");
}

function normalizeConstructParticipleWordLines(value: string) {
  return normalizeConstructParticipleAbbreviation(value)
    .split(/\r?\n/)
    .map((line) => {
      const dialectMatch = line.match(/^(\([^)]+\)\s*)(.*)$/);
      const dialectRest = dialectMatch?.[2] ?? "";

      if (dialectMatch && /^pc\b/i.test(dialectRest.trim())) {
        return `${dialectMatch[1]}${transformConstructParticipleLineForms(
          dialectRest,
        )}`;
      }

      if (/^pc\b/i.test(line.trim())) {
        return transformConstructParticipleLineForms(line);
      }

      return line;
    })
    .join("\n");
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

type DialectFormState =
  | "absolute"
  | "constructParticiples"
  | "nominal"
  | "pronominal"
  | "stative";

function createEmptyDialectForms(): DialectForms {
  return {
    absolute: "",
    nominal: "",
    pronominal: "",
    stative: "",
  };
}

function addUnique(values: string[] | undefined, value: string) {
  const next = new Set(values ?? []);
  next.add(value);

  return [...next];
}

function addDialectVariant(
  forms: DialectForms,
  state: Exclude<DialectFormState, "constructParticiples">,
  value: string,
) {
  forms.variants = {
    ...forms.variants,
    [state]: addUnique(forms.variants?.[state], value),
  };
}

function addConstructParticipleVariant(forms: DialectForms, value: string) {
  forms.variants = {
    ...forms.variants,
    constructParticiples: addUnique(
      forms.variants?.constructParticiples,
      value,
    ),
  };
}

function normalizeStateForm(value: string): {
  form: string;
  state: Exclude<DialectFormState, "constructParticiples">;
} | null {
  if (/^[a-z]+:/i.test(value)) {
    return null;
  }

  if (value.endsWith("-")) {
    return { form: value, state: "nominal" };
  }

  if (value.endsWith("=")) {
    return { form: value, state: "pronominal" };
  }

  if (value.endsWith("+")) {
    return { form: `${value.slice(0, -1)}†`, state: "stative" };
  }

  if (value.endsWith("†")) {
    return { form: value, state: "stative" };
  }

  return { form: value, state: "absolute" };
}

function ensureDialectForms(
  dialectsObj: Record<string, DialectForms>,
  dialectKey: string,
) {
  dialectsObj[dialectKey] ??= createEmptyDialectForms();

  return dialectsObj[dialectKey];
}

export function extractDialectsAndHeadword(wordRaw: string): {
  headword: string;
  dialects: Record<string, DialectForms>;
} {
  /**
   * Each parenthesized line carries one or more dialect sigla followed by the
   * form to store for that grammatical state.
   */
  const normalizedWordRaw = normalizeConstructParticipleWordLines(wordRaw);
  const lines = normalizedWordRaw.split("\n");
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
    const isConstructParticipleLine = forms.some((value) =>
      value.endsWith("~"),
    );

    if (forms.length === 0) {
      continue;
    }

    if (isConstructParticipleLine) {
      const constructParticiples = forms
        .map((candidate) => toConstructParticipleForm(candidate))
        .filter(Boolean);

      for (const dialectKey of dialectKeys) {
        const dialectForms = ensureDialectForms(dialectsObj, dialectKey);

        constructParticiples.forEach((constructParticiple, index) => {
          const canonicalConstructParticiple =
            dialectForms.constructParticiples?.[0];

          if (!canonicalConstructParticiple && index === 0) {
            dialectForms.constructParticiples = [constructParticiple];
          } else if (constructParticiple !== canonicalConstructParticiple) {
            addConstructParticipleVariant(dialectForms, constructParticiple);
          }
        });
      }

      continue;
    }

    for (const candidate of forms) {
      const parsedForm = normalizeStateForm(candidate);

      if (!parsedForm) {
        continue;
      }

      const { form, state } = parsedForm;

      if (state === "absolute" && !primaryHeadword) {
        primaryHeadword = form;
      }

      for (const dialectKey of dialectKeys) {
        const dialectForms = ensureDialectForms(dialectsObj, dialectKey);

        if (!dialectForms[state]) {
          dialectForms[state] = form;
        } else if (dialectForms[state] !== form) {
          addDialectVariant(dialectForms, state, form);
        }
      }
    }
  }

  if (!primaryHeadword) {
    const fallbackHeadword =
      normalizedWordRaw
        .split("\n")[0]
        ?.replace(/\{.*?\}/g, "")
        .replace(/^\(.*?\)\s*/, "")
        .split(",")[0]
        ?.trim() ?? "";

    primaryHeadword = /^pc\b/i.test(fallbackHeadword)
      ? toConstructParticipleForm(fallbackHeadword)
      : fallbackHeadword;
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

  const cleanWord = normalizeConstructParticipleWordLines(
    stripSourceHtml(row.word),
  );
  const cleanMeaning = normalizeMeaningDialectSigla(
    normalizeConstructParticipleAbbreviation(stripSourceHtml(row.meaning)),
  );
  const normalizedMeaning = normalizeMeaningPunctuation(cleanMeaning);
  const { headword, dialects } = extractDialectsAndHeadword(cleanWord);
  const pos = classifyPOS(normalizedMeaning);

  return {
    id,
    headword,
    dialects,
    pos,
    gender: classifyNounGender(normalizedMeaning, pos),
    english_meanings: splitMeaningLines(normalizedMeaning),
    greek_equivalents: extractGreek(normalizedMeaning),
    raw: {
      word: cleanWord,
      meaning: normalizedMeaning,
    },
  };
}
