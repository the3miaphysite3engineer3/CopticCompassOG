import { getLocalizedPath } from "@/lib/locale";
import type { Language } from "@/types/i18n";

/**
 * Builds the localized or locale-agnostic route path for one grammar lesson
 * page.
 */
export function getGrammarLessonPath(slug: string, locale?: Language) {
  const path = `/grammar/${slug}`;
  return locale ? getLocalizedPath(locale, path) : path;
}
