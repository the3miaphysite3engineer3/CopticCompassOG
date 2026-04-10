import { cookies, headers } from "next/headers";

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, isLanguage } from "@/lib/i18n";
import { assertServerOnly } from "@/lib/server/assertServerOnly";
import type { Language } from "@/types/i18n";

assertServerOnly("preferredLanguage");

/**
 * Extracts the first supported application language from an
 * `Accept-Language` header value.
 */
function getLanguageFromAcceptLanguage(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return null;
  }

  const preferredCodes = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.slice(0, 2).toLowerCase())
    .filter((value): value is string => Boolean(value));

  for (const code of preferredCodes) {
    if (isLanguage(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Resolves the preferred UI language from the persisted cookie first, then
 * falls back to the request `Accept-Language` header and finally the default
 * locale.
 */
export async function getPreferredLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const storedLanguage = cookieStore.get(LANGUAGE_STORAGE_KEY)?.value;

  if (storedLanguage && isLanguage(storedLanguage)) {
    return storedLanguage;
  }

  const headerStore = await headers();
  return (
    getLanguageFromAcceptLanguage(headerStore.get("accept-language")) ??
    DEFAULT_LANGUAGE
  );
}
