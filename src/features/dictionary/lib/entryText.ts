import {
  type DictionaryDialectCode,
  DICTIONARY_MEANING_GROUP_CODES,
  getPartOfSpeechLabel,
} from "@/features/dictionary/config";
import { DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS } from "@/features/dictionary/grammarRegistry";
import { getPrimaryEntryPartOfSpeech } from "@/features/dictionary/lib/entryGrammar";
import type {
  DialectForms,
  DictionaryClientEntry,
  DictionaryGenderedMeaningMarker,
  DictionaryGenderedMeaningValues,
  DictionaryMeaningGroup,
  LexicalEntry,
} from "@/features/dictionary/types";
import { getTranslation } from "@/lib/i18n";
import type { Language } from "@/types/i18n";

const entryLeadIns = [
  ...DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS,
  "m",
  "f",
] as const;

type EntryMeaningSource = Pick<
  DictionaryClientEntry,
  "dialectMeanings" | "genderedMeanings" | "meaningGroups"
>;
type MeaningGroupDisplayOptions = {
  dialectForms?: DialectForms;
  hasImperativeForms?: boolean;
};

type LocalizedDictionaryMeaningGroup = {
  code: string;
  genderedRows?: LocalizedDictionaryGenderedMeaning[];
  meanings: string[];
  notes: string[];
};

type LocalizedDictionaryDialectMeaning = {
  dialects: DictionaryDialectCode[];
  meanings: string[];
  notes: string[];
  sourceLabel: string;
};

type LocalizedDictionaryGenderedMeaning = {
  values: Array<{
    marker: DictionaryGenderedMeaningMarker;
    meaning: string;
  }>;
};

const GENDERED_MEANING_MARKERS = [
  "m",
  "f",
  "pl",
] as const satisfies readonly DictionaryGenderedMeaningMarker[];

export function toPlainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Removes imported grammar shorthand from the start of a gloss so metadata and
 * summaries surface the first real lexical meaning instead.
 */
function stripLeadIn(value: string) {
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

function normalizeMeaningKey(value: string) {
  return stripLeadIn(value).toLocaleLowerCase();
}

function getLocalizedTextValues(
  englishValues: string[] | undefined,
  dutchValues: string[] | undefined,
  locale: Language,
) {
  if (locale === "nl") {
    return dutchValues?.length ? dutchValues : (englishValues ?? []);
  }

  return englishValues?.length ? englishValues : (dutchValues ?? []);
}

function getLocalizedGenderedMeaningValues(
  values: DictionaryGenderedMeaningValues | undefined,
) {
  return GENDERED_MEANING_MARKERS.flatMap((marker) => {
    const meaning = values?.[marker]?.trim();

    return meaning ? [{ marker, meaning }] : [];
  });
}

function getLocalizedGenderedMeaningTexts(
  entry: EntryMeaningSource,
  locale: Language = "en",
) {
  return getLocalizedGenderedMeanings(entry, locale).map((row) =>
    row.values.map(({ meaning }) => meaning).join("; "),
  );
}

function hasVisibleValues(values: readonly string[] | undefined) {
  return values?.some((value) => value.trim().length > 0) ?? false;
}

const COMPACT_DIALECT_MEANING_GROUP_NOTE_PATTERN =
  /^(?:(?:Fb|La|Sa|Sf|Sl)|[ABFLOMS])+$/u;
const MEANING_GROUP_CODE_SET = new Set<string>(DICTIONARY_MEANING_GROUP_CODES);

function isDisplayableMeaningGroupNote(note: string) {
  const normalizedNote = note.trim();

  return (
    normalizedNote.length > 0 &&
    !COMPACT_DIALECT_MEANING_GROUP_NOTE_PATTERN.test(normalizedNote)
  );
}

function getMeaningGroups(
  entry: EntryMeaningSource,
): readonly DictionaryMeaningGroup[] {
  const groups = entry.meaningGroups as unknown;

  if (!groups) {
    return [];
  }

  if (Array.isArray(groups)) {
    return groups as DictionaryMeaningGroup[];
  }

  if (typeof groups === "object") {
    const groupMap = groups as Partial<Record<string, DictionaryMeaningGroup>>;

    return DICTIONARY_MEANING_GROUP_CODES.flatMap((code) => {
      const group = groupMap[code];

      return group ? [group] : [];
    });
  }

  return [];
}

function toMeaningGroupCode(value: string | undefined) {
  return value && MEANING_GROUP_CODE_SET.has(value) ? value : "";
}

function getMeaningGroupDisplayCode(group: DictionaryMeaningGroup) {
  const grammar = group.grammar;

  return (
    toMeaningGroupCode(grammar.valency) ||
    toMeaningGroupCode(grammar.mood) ||
    toMeaningGroupCode(grammar.form) ||
    toMeaningGroupCode(grammar.voice) ||
    toMeaningGroupCode(grammar.derivation) ||
    toMeaningGroupCode(grammar.affix) ||
    toMeaningGroupCode(grammar.caseRole) ||
    toMeaningGroupCode(grammar.polarity) ||
    toMeaningGroupCode(grammar.number) ||
    toMeaningGroupCode(grammar.tags?.[0]) ||
    toMeaningGroupCode(grammar.pos) ||
    grammar.pos ||
    ""
  );
}

function isMeaningGroupAvailableForDialect(
  code: string,
  dialectForms: DialectForms | undefined,
  options: MeaningGroupDisplayOptions,
) {
  if (!dialectForms) {
    return true;
  }

  switch (code) {
    case "IMP":
      return options.hasImperativeForms ?? true;
    case "PC":
      return (
        hasVisibleValues(dialectForms.constructParticiples) ||
        hasVisibleValues(dialectForms.variants?.constructParticiples) ||
        (dialectForms.constructParticipleCompounds?.length ?? 0) > 0
      );
    case "STA":
      return Boolean(
        dialectForms.stative?.trim() ||
        hasVisibleValues(dialectForms.variants?.stative),
      );
    default:
      return true;
  }
}

export function getLocalizedGenderedMeanings(
  entry: EntryMeaningSource,
  locale: Language = "en",
): LocalizedDictionaryGenderedMeaning[] {
  return (entry.genderedMeanings ?? [])
    .map((genderedMeaning) => {
      const localizedValues =
        locale === "nl" && genderedMeaning.dutch
          ? genderedMeaning.dutch
          : genderedMeaning.english;

      return {
        values: getLocalizedGenderedMeaningValues(localizedValues),
      };
    })
    .filter((genderedMeaning) => genderedMeaning.values.length > 0);
}

export function getLocalizedMeaningGroups(
  entry: EntryMeaningSource,
  locale: Language = "en",
  options: MeaningGroupDisplayOptions = {},
): LocalizedDictionaryMeaningGroup[] {
  const genderedMeanings = getLocalizedGenderedMeanings(entry, locale);
  let attachedGenderedMeanings = false;

  return getMeaningGroups(entry).flatMap((group) => {
    const code = getMeaningGroupDisplayCode(group);

    if (
      !code ||
      !isMeaningGroupAvailableForDialect(code, options.dialectForms, options)
    ) {
      return [];
    }

    const meanings = getLocalizedTextValues(
      group.english_meanings,
      group.dutch_meanings,
      locale,
    );
    const notes = getLocalizedTextValues(
      group.english_notes,
      group.dutch_notes,
      locale,
    );
    const genderedRows =
      group.grammar.pos === "N" && !attachedGenderedMeanings
        ? genderedMeanings
        : [];

    if (genderedRows.length > 0) {
      attachedGenderedMeanings = true;
    }

    return [
      {
        code,
        ...(genderedRows.length > 0 ? { genderedRows } : {}),
        meanings,
        notes: notes.filter(isDisplayableMeaningGroupNote),
      },
    ];
  });
}

function getLocalizedDialectMeanings(
  entry: EntryMeaningSource,
  locale: Language = "en",
): LocalizedDictionaryDialectMeaning[] {
  return (entry.dialectMeanings ?? [])
    .map((dialectMeaning) => {
      const meanings = getLocalizedTextValues(
        dialectMeaning.english_meanings,
        dialectMeaning.dutch_meanings,
        locale,
      );
      const notes = getLocalizedTextValues(
        dialectMeaning.english_notes,
        dialectMeaning.dutch_notes,
        locale,
      );

      return {
        dialects: dialectMeaning.dialects,
        meanings,
        notes,
        sourceLabel: dialectMeaning.sourceLabel,
      };
    })
    .filter(
      (dialectMeaning) =>
        dialectMeaning.meanings.length > 0 || dialectMeaning.notes.length > 0,
    );
}

export function getLocalizedDisplayDialectMeanings(
  entry: EntryMeaningSource,
  locale: Language = "en",
): LocalizedDictionaryDialectMeaning[] {
  const groupedMeaningKeys = new Set(
    getLocalizedMeaningGroups(entry, locale)
      .flatMap((group) => group.meanings)
      .map((meaning) => normalizeMeaningKey(meaning))
      .filter(Boolean),
  );

  return getLocalizedDialectMeanings(entry, locale)
    .map((dialectMeaning) => ({
      ...dialectMeaning,
      meanings: dialectMeaning.meanings.filter((meaning) => {
        const meaningKey = normalizeMeaningKey(meaning);

        return meaningKey && !groupedMeaningKeys.has(meaningKey);
      }),
    }))
    .filter(
      (dialectMeaning) =>
        dialectMeaning.meanings.length > 0 || dialectMeaning.notes.length > 0,
    );
}

export function getLocalizedMeaningValues(
  entry: EntryMeaningSource,
  locale: Language = "en",
) {
  const values = [
    ...getLocalizedGenderedMeaningTexts(entry, locale),
    ...getLocalizedMeaningGroups(entry, locale).flatMap((group) => [
      ...group.meanings,
      ...group.notes,
    ]),
    ...getLocalizedDialectMeanings(entry, locale).flatMap((dialectMeaning) => [
      ...dialectMeaning.meanings,
      ...dialectMeaning.notes,
    ]),
  ];
  const seenKeys = new Set<string>();

  return values.filter((value) => {
    const meaningKey = normalizeMeaningKey(value);

    if (!meaningKey || seenKeys.has(meaningKey)) {
      return false;
    }

    seenKeys.add(meaningKey);
    return true;
  });
}

export function getEntryMeaningPreview(
  entry: EntryMeaningSource,
  locale: Language = "en",
  limit = 2,
) {
  return getLocalizedMeaningValues(entry, locale).slice(0, limit);
}

/**
 * Returns the first gloss that reads like a user-facing summary instead of a
 * bare grammar label or import shorthand fragment.
 */
export function getEntrySummary(entry: LexicalEntry, locale: Language = "en") {
  for (const meaning of getLocalizedMeaningValues(entry, locale)) {
    const candidate = stripLeadIn(meaning);
    if (candidate && !isPureGrammarLeadIn(candidate)) {
      return candidate;
    }
  }

  return "";
}

/**
 * Builds the meta description used for dictionary entry pages from the chosen
 * headword, part of speech, and first meaningful gloss when available.
 */
export function buildEntryDescription(
  entry: LexicalEntry,
  locale: Language = "en",
  options: {
    displayHeadword?: string;
    summary?: string;
  } = {},
) {
  const headword = options.displayHeadword ?? toPlainText(entry.headword);
  const firstMeaning = options.summary ?? getEntrySummary(entry, locale);
  const partOfSpeech = getPartOfSpeechLabel(
    getPrimaryEntryPartOfSpeech(entry),
    (key) => getTranslation(locale, key),
  );

  if (locale === "nl") {
    return firstMeaning
      ? `${headword} (${partOfSpeech}) in het Koptische woordenboek. ${firstMeaning}.`
      : `${headword} (${partOfSpeech}) in het Koptische woordenboek van Coptic Compass.`;
  }

  return firstMeaning
    ? `${headword} (${partOfSpeech}) in the Coptic dictionary. ${firstMeaning}.`
    : `${headword} (${partOfSpeech}) in the Coptic dictionary on Coptic Compass.`;
}
