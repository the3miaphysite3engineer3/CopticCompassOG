import { getDictionaryPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Dictionary Redirect",
  description: "Redirects visitors to the primary localized dictionary route.",
});

/**
 * Redirects the legacy dictionary route to the preferred localized destination.
 */
export default async function LegacyDictionaryRedirectPage() {
  return redirectToPreferredLocale(getDictionaryPath);
}
