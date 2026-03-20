export interface DialectForms {
  absolute: string;
  nominal: string;
  pronominal: string;
  stative: string;
}

export interface LexicalEntry {
  id: string;
  headword: string;
  dialects: Record<string, DialectForms>;
  pos: string;
  gender: string;
  english_meanings: string[];
  greek_equivalents: string[];
  raw: {
    word: string;
    meaning: string;
  };
}
