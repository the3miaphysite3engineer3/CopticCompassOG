import type {
  DictionaryDialectCode,
  DictionaryMeaningGroupCode,
  PartOfSpeech,
} from "@/features/dictionary/config";

/**
 * Shared dictionary domain types used by the build pipeline, search helpers,
 * and entry UI.
 */
export type LexicalGender = "" | "BOTH" | "F" | "M";
export type DictionaryEtymology = "Egy" | "Gr" | "Unknown";
export type DictionaryGenderedMeaningMarker = "f" | "m" | "pl";
type DictionaryInflectedFormKind =
  | "dual"
  | "feminine"
  | "imperative"
  | "masculine"
  | "plural";
type DictionaryInflectedFormRole = "absolute" | "nominal" | "pronominal";
type DictionaryMeaningGroupGrammarAffix = "PFX" | "SFX";
type DictionaryMeaningGroupGrammarCaseRole = "DAT" | "OBJ";
type DictionaryMeaningGroupGrammarDerivation = "CAUS";
type DictionaryMeaningGroupGrammarForm = "ABS" | "PC" | "STA" | "VBAL";
export type DictionaryMeaningGroupGrammarGender = Exclude<LexicalGender, "">;
type DictionaryMeaningGroupGrammarMood = "IMP";
type DictionaryMeaningGroupGrammarNumber = "PL" | "SG";
export type DictionaryMeaningGroupGrammarPartOfSpeech = PartOfSpeech | "PRON";
type DictionaryMeaningGroupGrammarPolarity = "NEG";
type DictionaryMeaningGroupGrammarValency = "INTR" | "TR";
type DictionaryMeaningGroupGrammarVoice = "REFL";

/**
 * A structured inflected or counterpart form that may not deserve a full
 * lexical entry.
 */
export interface DictionaryInflectedForm {
  kind: DictionaryInflectedFormKind;
  form: string;
  dialect?: DictionaryDialectCode;
  entryId?: string;
  notes?: string[];
  role?: DictionaryInflectedFormRole;
  uncertain?: boolean;
}

export interface DialectFormVariants {
  absolute?: string[];
  constructParticiples?: string[];
  nominal?: string[];
  pronominal?: string[];
  stative?: string[];
}

/**
 * A derived lexical compound built from a dialect-specific construct
 * participle. These are not variants of the base form.
 */
export interface ConstructParticipleCompound {
  form: string;
  sourceConstructParticiple?: string;
  gender?: LexicalGender;
  english_meanings: string[];
  dutch_meanings?: string[];
}

export interface DialectForms {
  absolute?: string;
  constructParticipleCompounds?: ConstructParticipleCompound[];
  constructParticiples?: string[];
  nominal?: string;
  pronominal?: string;
  stative?: string;
  variants?: DialectFormVariants;
}

export type DictionaryDialectFormsMap = Partial<
  Record<DictionaryDialectCode, DialectForms>
>;

export interface DictionaryMeaningGroupGrammar {
  affix?: DictionaryMeaningGroupGrammarAffix;
  caseRole?: DictionaryMeaningGroupGrammarCaseRole;
  derivation?: DictionaryMeaningGroupGrammarDerivation;
  form?: DictionaryMeaningGroupGrammarForm;
  gender?: DictionaryMeaningGroupGrammarGender;
  mood?: DictionaryMeaningGroupGrammarMood;
  number?: DictionaryMeaningGroupGrammarNumber;
  polarity?: DictionaryMeaningGroupGrammarPolarity;
  pos: DictionaryMeaningGroupGrammarPartOfSpeech;
  tags?: DictionaryMeaningGroupCode[];
  valency?: DictionaryMeaningGroupGrammarValency;
  voice?: DictionaryMeaningGroupGrammarVoice;
}

export interface DictionaryMeaningGroup {
  dutch_meanings?: string[];
  dutch_notes?: string[];
  english_meanings?: string[];
  english_notes?: string[];
  grammar: DictionaryMeaningGroupGrammar;
}

export type DictionaryMeaningGroups = DictionaryMeaningGroup[];

export type DictionaryGenderedMeaningValues = Partial<
  Record<DictionaryGenderedMeaningMarker, string>
>;

export interface DictionaryGenderedMeaning {
  english: DictionaryGenderedMeaningValues;
  dutch?: DictionaryGenderedMeaningValues;
}

export interface DictionaryDialectMeaning {
  sourceLabel: string;
  dialects: DictionaryDialectCode[];
  dutch_meanings?: string[];
  dutch_notes?: string[];
  english_meanings?: string[];
  english_notes?: string[];
}

/**
 * Represents one normalized dictionary entry as consumed by the app and the
 * generated public JSON snapshot.
 */
export interface LexicalEntry {
  id: string;
  headword: string;
  dialects: DictionaryDialectFormsMap;
  meaningGroups: DictionaryMeaningGroups;
  genderedMeanings?: DictionaryGenderedMeaning[];
  dialectMeanings?: DictionaryDialectMeaning[];
  greek_equivalents?: string[];
  etymology: DictionaryEtymology;
  inflectedForms?: DictionaryInflectedForm[];
}

/**
 * Represents the reduced dictionary shape needed by search-result cards and
 * analytics drilldowns.
 */
export type DictionaryClientEntry = Pick<
  LexicalEntry,
  | "dialects"
  | "dialectMeanings"
  | "etymology"
  | "genderedMeanings"
  | "headword"
  | "id"
  | "inflectedForms"
  | "meaningGroups"
> & {
  greek_equivalents?: string[];
};
