import type {
  DictionaryDialectCode,
  DictionarySenseCode,
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
type DictionarySenseGrammarAffix = "PFX" | "SFX";
type DictionarySenseGrammarCaseRole = "DAT" | "OBJ";
type DictionarySenseGrammarDerivation = "CAUS";
type DictionarySenseGrammarForm = "ABS" | "PC" | "STA" | "VBAL";
export type DictionarySenseGrammarGender = Exclude<LexicalGender, "">;
type DictionarySenseGrammarMood = "IMP";
type DictionarySenseGrammarNumber = "PL" | "SG";
export type DictionarySenseGrammarPartOfSpeech = PartOfSpeech | "PRON";
type DictionarySenseGrammarPolarity = "NEG";
type DictionarySenseGrammarValency = "INTR" | "TR";
type DictionarySenseGrammarVoice = "REFL";

/**
 * A structured inflected or counterpart form that may not deserve a full
 * lexical entry.
 */
export interface DictionaryInflectedFormDetails {
  form: string;
  entryId?: number;
  notes?: string[];
  uncertain?: boolean;
}

export type DictionaryInflections = Partial<
  Record<
    DictionaryInflectedFormKind,
    Partial<
      Record<
        DictionaryDialectCode,
        Partial<
          Record<
            DictionaryInflectedFormRole | "default",
            (string | DictionaryInflectedFormDetails)[]
          >
        >
      >
    >
  >
>;

export interface DialectFormVariants {
  absolute?: string[];
  constructParticiples?: string[];
  nominal?: string[];
  pronominal?: string[];
  stative?: string[];
}

export interface DialectForms {
  absolute?: string;
  participles?: string[];
  nominal?: string;
  pronominal?: string;
  stative?: string;
  variants?: DialectFormVariants;
}

export type DictionaryDialectFormsMap = Partial<
  Record<DictionaryDialectCode, DialectForms>
>;

export interface DictionarySenseGrammar {
  affix?: DictionarySenseGrammarAffix;
  caseRole?: DictionarySenseGrammarCaseRole;
  derivation?: DictionarySenseGrammarDerivation;
  form?: DictionarySenseGrammarForm;
  gender?: DictionarySenseGrammarGender;
  mood?: DictionarySenseGrammarMood;
  number?: DictionarySenseGrammarNumber;
  polarity?: DictionarySenseGrammarPolarity;
  pos: DictionarySenseGrammarPartOfSpeech;
  tags?: DictionarySenseCode[];
  valency?: DictionarySenseGrammarValency;
  voice?: DictionarySenseGrammarVoice;
}

export interface DictionarySense {
  meanings?: {
    en?: string[];
    nl?: string[];
  };
  notes?: {
    en?: string[];
    nl?: string[];
  };
  grammar: DictionarySenseGrammar;
}

export type DictionarySenses = DictionarySense[];

export type DictionaryGenderedMeaningValues = Partial<
  Record<DictionaryGenderedMeaningMarker, string>
>;

export interface DictionaryGenderedMeaning {
  meanings?: {
    en?: DictionaryGenderedMeaningValues;
    nl?: DictionaryGenderedMeaningValues;
  };
}

export interface DictionaryDialectMeaning {
  sourceLabel: string;
  dialects: DictionaryDialectCode[];
  meanings?: {
    en?: string[];
    nl?: string[];
  };
  notes?: {
    en?: string[];
    nl?: string[];
  };
}

/**
 * Represents one normalized dictionary entry as consumed by the app and the
 * generated public JSON snapshot.
 */
export interface LexicalEntry {
  id: number;
  root_id?: number;
  headword: string;
  dialects: DictionaryDialectFormsMap;
  senses: DictionarySenses;
  genderedMeanings?: DictionaryGenderedMeaning[];
  dialectMeanings?: DictionaryDialectMeaning[];
  greek?: string[];
  etym: DictionaryEtymology;
  inflections?: DictionaryInflections;
}

export type DictionaryRootReference = Pick<
  LexicalEntry,
  "dialects" | "headword" | "id"
>;

/**
 * Represents the reduced dictionary shape needed by search-result cards and
 * analytics drilldowns.
 */
export type DictionaryClientEntry = Pick<
  LexicalEntry,
  | "dialects"
  | "dialectMeanings"
  | "etym"
  | "genderedMeanings"
  | "headword"
  | "id"
  | "inflections"
  | "root_id"
  | "senses"
> & {
  rootEntry?: DictionaryRootReference;
  greek?: string[];
};
