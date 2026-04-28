import type {
  DictionaryDialectCode,
  PartOfSpeech,
} from "@/features/dictionary/config";

/**
 * Shared dictionary domain types used by the build pipeline, search helpers,
 * and entry UI.
 */
export type LexicalGender = "" | "BOTH" | "F" | "M";
export type LexicalRelationType =
  | "feminine-counterpart"
  | "derived-subentry"
  | "paradigm-member";

export interface DialectFormVariants {
  absolute?: string[];
  constructParticiples?: string[];
  nominal?: string[];
  pronominal?: string[];
  stative?: string[];
}

export interface DialectForms {
  absolute: string;
  constructParticiples?: string[];
  nominal: string;
  pronominal: string;
  stative: string;
  variants?: DialectFormVariants;
}

export type DictionaryDialectFormsMap = Partial<
  Record<DictionaryDialectCode, DialectForms>
>;

/**
 * Represents one normalized dictionary entry as consumed by the app and the
 * generated public JSON snapshot.
 */
export interface LexicalEntry {
  id: string;
  headword: string;
  dialects: DictionaryDialectFormsMap;
  pos: PartOfSpeech;
  gender: LexicalGender;
  parentEntryId?: string;
  relationType?: LexicalRelationType;
  english_meanings: string[];
  dutch_meanings?: string[];
  greek_equivalents: string[];
  bohairicParadigmData?: unknown;
  etymology?: "Egy" | "Gr";
  raw: {
    word: string;
    meaning: string;
  };
}

/**
 * Represents the reduced dictionary shape needed by search-result cards and
 * analytics drilldowns without shipping the full raw/source payload.
 */
export type DictionaryClientEntry = Pick<
  LexicalEntry,
  | "dialects"
  | "dutch_meanings"
  | "english_meanings"
  | "etymology"
  | "gender"
  | "greek_equivalents"
  | "headword"
  | "id"
  | "pos"
  | "relationType"
>;
