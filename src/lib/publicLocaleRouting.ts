import { notFound, redirect } from "next/navigation";

import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { isPublicLocale } from "@/lib/locale";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";
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

/**
 * Redirects a locale-agnostic entry route to the user's preferred public
 * locale.
 */
export async function redirectToPreferredLocale(
  buildPath: (locale: Language) => string,
): Promise<never> {
  const preferredLanguage = await getPreferredLanguage();
  redirect(buildPath(preferredLanguage));
}

/**
 * Resolves route params and the user's preferred public locale in parallel,
 * then redirects to the localized destination path.
 */
export async function redirectToPreferredLocaleWithParams<T>(
  paramsPromise: Promise<T>,
  buildPath: (params: T, locale: Language) => string,
): Promise<never> {
  const [params, preferredLanguage] = await Promise.all([
    paramsPromise,
    getPreferredLanguage(),
  ]);

  redirect(buildPath(params, preferredLanguage));
}
