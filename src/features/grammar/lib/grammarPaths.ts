import type { Language } from "@/types/i18n";
import { getLocalizedPath } from "@/lib/locale";

export function getGrammarLessonPath(slug: string, locale?: Language) {
  const path = `/grammar/${slug}`;
  return locale ? getLocalizedPath(locale, path) : path;
}
