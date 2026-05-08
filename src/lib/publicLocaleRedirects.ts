import { redirect } from "next/navigation";

import { getPreferredLanguage } from "@/lib/server/preferredLanguage";
import type { Language } from "@/types/i18n";

/**
 * Redirects a locale-agnostic entry route to the user's preferred public
 * locale. Kept separate from static locale helpers so localized pages do not
 * import request-bound cookies/headers APIs.
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
