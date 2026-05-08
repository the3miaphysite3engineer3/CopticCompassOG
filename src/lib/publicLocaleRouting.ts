import { notFound } from "next/navigation";

import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { isPublicLocale } from "@/lib/locale";
import type { Language } from "@/types/i18n";

/**
 * Resolves an optional route locale param to a supported public locale, falling
 * back to the default locale when the param is missing or invalid.
 */
export function resolvePublicLocale(locale?: string): Language {
  return locale && isPublicLocale(locale) ? locale : DEFAULT_LANGUAGE;
}

/**
 * Enforces that a route locale param is one of the supported public locales
 * and triggers Next.js `notFound()` for invalid values.
 */
export function requirePublicLocale(locale?: string): Language {
  if (!locale || !isPublicLocale(locale)) {
    notFound();
  }

  return locale;
}
