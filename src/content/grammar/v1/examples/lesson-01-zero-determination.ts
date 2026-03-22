import type { GrammarExampleDocument } from "../../schema.ts";
import {
  grammarLesson01ConceptIds,
  grammarLesson01Id,
} from "../lesson-01-ids.ts";

const lessonId = grammarLesson01Id;
const sectionId = `${lessonId}.section.zero-determination`;

export const grammarLesson01ZeroDeterminationExamples: readonly GrammarExampleDocument[] = [
  {
    id: "grammar.example.lesson01.zero-determination.001",
    lessonId,
    sectionId,
    coptic: "Ø-ⲣⲱⲙⲓ ⲛⲓⲃⲉⲛ",
    translation: {
      en: "“every man”",
      nl: "“iedere mens”",
    },
    conceptRefs: [grammarLesson01ConceptIds.zeroDetermination],
    dictionaryRefs: [],
    tags: ["lesson-1", "zero-determination", "quantifier"],
  },
  {
    id: "grammar.example.lesson01.zero-determination.002",
    lessonId,
    sectionId,
    coptic: "Ø-ⲥ̀ϩⲓⲙⲓ ⲛⲓⲃⲉⲛ",
    translation: {
      en: "“every woman”",
      nl: "“elke vrouw”",
    },
    conceptRefs: [grammarLesson01ConceptIds.zeroDetermination],
    dictionaryRefs: [],
    tags: ["lesson-1", "zero-determination", "quantifier"],
  },
  {
    id: "grammar.example.lesson01.zero-determination.003",
    lessonId,
    sectionId,
    coptic: "Ø-ⲁⲅⲓⲟⲥ ⲛⲓⲃⲉⲛ",
    translation: {
      en: "“every saint”",
      nl: "“iedere heilige”",
    },
    conceptRefs: [grammarLesson01ConceptIds.zeroDetermination],
    dictionaryRefs: [],
    tags: ["lesson-1", "zero-determination", "quantifier"],
  },
  {
    id: "grammar.example.lesson01.zero-determination.004",
    lessonId,
    sectionId,
    coptic: "Ø-ⲉⲕⲕ̀ⲗⲏⲥⲓⲁ̀ ⲛⲓⲃⲉⲛ",
    translation: {
      en: "“every church”",
      nl: "“iedere kerk”",
    },
    conceptRefs: [grammarLesson01ConceptIds.zeroDetermination],
    dictionaryRefs: [],
    tags: ["lesson-1", "zero-determination", "quantifier"],
  },
] as const;
