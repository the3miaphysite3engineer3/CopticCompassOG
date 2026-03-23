import type { LexicalEntry } from "@/features/dictionary/types";

const entryLeadIns = [
  "intr",
  "tr",
  "auxil",
  "qual",
  "vb",
  "nn",
  "adj",
  "adv",
  "prep",
  "conj",
  "interj",
  "imperative",
  "interrog",
  "neg",
  "obj",
  "dat",
  "ethic",
  "ethical",
  "suff",
  "pref",
  "pronom",
  "subj",
  "nom",
  "acc",
  "gen",
  "pl",
  "sg",
  "art",
  "def",
  "indef",
  "poss",
  "rel",
  "pron",
  "gk",
  "esp",
  "lit",
  "caus",
  "sim",
  "prob",
  "rare",
  "constr",
  "vbal",
  "p.c.",
  "p c",
  "m",
  "f",
] as const;

export function toPlainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function stripLeadIn(value: string) {
  // Imported meanings often start with grammar shorthand such as "tr" or
  // "nn"; strip those prefixes so metadata surfaces a real gloss.
  let cleaned = toPlainText(value.replace(/\[[^\]]+\]/g, ""))
    .replace(/^[|―—–-]+\s*/, "")
    .trim();

  while (cleaned) {
    const lowered = cleaned.toLowerCase();
    const matchedLeadIn = entryLeadIns.find(
      (leadIn) =>
        lowered === leadIn ||
        lowered.startsWith(`${leadIn}:`) ||
        lowered.startsWith(`${leadIn},`) ||
        lowered.startsWith(`${leadIn} `),
    );

    if (!matchedLeadIn) {
      break;
    }

    cleaned = cleaned
      .slice(matchedLeadIn.length)
      .replace(/^[:.,;)\]\s-]+/, "")
      .trim();
  }

  return cleaned;
}

function isPureGrammarLeadIn(value: string) {
  if (!value) {
    return true;
  }

  return (
    /^[(?[a-z]\)?.,\s:-]+$/i.test(value) &&
    !/[\u03e2-\u03ef\u2c80-\u2cff]/i.test(value) &&
    value.split(/\s+/).length <= 4
  );
}

export function getEntrySummary(entry: LexicalEntry) {
  for (const meaning of entry.english_meanings) {
    const candidate = stripLeadIn(meaning);
    if (candidate && !isPureGrammarLeadIn(candidate)) {
      return candidate;
    }
  }

  return "";
}

export function buildEntryDescription(entry: LexicalEntry) {
  const headword = toPlainText(entry.headword);
  const firstMeaning = getEntrySummary(entry);

  return firstMeaning
    ? `${headword} (${entry.pos}) in the Coptic dictionary. ${firstMeaning}.`
    : `${headword} (${entry.pos}) in the Coptic dictionary by Kyrillos Wannes.`;
}
