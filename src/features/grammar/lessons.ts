import type { TranslationKey } from "@/lib/i18n";
import type { Language } from "@/types/i18n";

export type GrammarLessonSlug = "lesson-1" | "lesson-2";
export type GrammarLessonStatus = "available" | "comingSoon";
export type GrammarLessonLocalizedLabel = Record<Language, string>;

export type GrammarLessonSectionDefinition = {
  id: string;
  title: GrammarLessonLocalizedLabel;
};

export type GrammarLessonDefinition = {
  id: string;
  slug: GrammarLessonSlug;
  number: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  status: GrammarLessonStatus;
  sections: readonly GrammarLessonSectionDefinition[];
};

const lesson01Sections = [
  {
    id: "definitions",
    title: {
      en: "Definitions",
      nl: "Definities",
    },
  },
  {
    id: "vocabulary-bare-nouns",
    title: {
      en: "Vocabulary: Bare Nouns",
      nl: "Woordenschat: Kale zelfstandige naamwoorden",
    },
  },
  {
    id: "significant-letters",
    title: {
      en: "Significant Letters",
      nl: "Significante letters",
    },
  },
  {
    id: "determiner-selection",
    title: {
      en: "Determiner Selection",
      nl: "Selectie van determinatoren",
    },
  },
  {
    id: "zero-determination",
    title: {
      en: "Zero-Determination",
      nl: "Nul-determinatie",
    },
  },
  {
    id: "bipartite-nominal-sentence",
    title: {
      en: "Bipartite Nominal Sentence",
      nl: "Tweeledige nominale zin",
    },
  },
  {
    id: "independent-pronouns",
    title: {
      en: "Independent Personal Pronouns",
      nl: "Onafhankelijke persoonlijke voornaamwoorden",
    },
  },
  {
    id: "abbreviations",
    title: {
      en: "Abbreviations",
      nl: "Afkortingen",
    },
  },
  {
    id: "exercise-01",
    title: {
      en: "Exercise 01",
      nl: "Oefening 01",
    },
  },
] as const satisfies readonly GrammarLessonSectionDefinition[];

export const grammarLessons = [
  {
    id: "grammar-lesson-01",
    slug: "lesson-1",
    number: "01",
    titleKey: "grammar.lesson1.title",
    descriptionKey: "grammar.lesson1.desc",
    status: "available",
    sections: lesson01Sections,
  },
  {
    id: "grammar-lesson-02",
    slug: "lesson-2",
    number: "02",
    titleKey: "grammar.lesson2.title",
    descriptionKey: "grammar.lesson2.desc",
    status: "comingSoon",
    sections: [],
  },
] as const satisfies readonly GrammarLessonDefinition[];

export function getGrammarLessonBySlug(slug: GrammarLessonSlug) {
  return grammarLessons.find((lesson) => lesson.slug === slug) ?? null;
}

export function getGrammarLessonSectionById(
  lesson: GrammarLessonDefinition,
  sectionId: string
) {
  return lesson.sections.find((section) => section.id === sectionId) ?? null;
}

export function getLocalizedGrammarLessonLabel(
  language: Language,
  label: GrammarLessonLocalizedLabel
) {
  return label[language];
}

export function getGrammarLessonRoute(slug: GrammarLessonSlug) {
  return `/grammar/${slug}`;
}

export function isAvailableGrammarLesson(lesson: GrammarLessonDefinition) {
  return lesson.status === "available";
}
