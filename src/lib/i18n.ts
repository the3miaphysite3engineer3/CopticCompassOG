import type { Language } from "@/types/i18n";
import { contactMessages } from "@/lib/translations/contact";
import { dictionaryMessages } from "@/lib/translations/dictionary";
import { grammarMessages } from "@/lib/translations/grammar";
import { homeMessages } from "@/lib/translations/home";
import { loginMessages } from "@/lib/translations/login";
import { publicationsMessages } from "@/lib/translations/publications";
import { sharedMessages } from "@/lib/translations/shared";

const en = {
  ...sharedMessages.en,
  ...homeMessages.en,
  ...publicationsMessages.en,
  ...dictionaryMessages.en,
  ...grammarMessages.en,
  ...contactMessages.en,
  ...loginMessages.en,
} as const;

export type TranslationKey = keyof typeof en;
export type TranslationDictionary = Readonly<Record<TranslationKey, string>>;

const nl = {
  ...sharedMessages.nl,
  ...homeMessages.nl,
  ...publicationsMessages.nl,
  ...dictionaryMessages.nl,
  ...grammarMessages.nl,
  ...contactMessages.nl,
  ...loginMessages.nl,
} satisfies TranslationDictionary;

export const translations = {
  en,
  nl,
} satisfies Record<Language, TranslationDictionary>;

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "app-language";

export function isLanguage(value: string): value is Language {
  return value === "en" || value === "nl";
}

export function getTranslation(
  language: Language,
  key: TranslationKey,
): string {
  return translations[language][key];
}
