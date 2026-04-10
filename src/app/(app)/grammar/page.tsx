import { getGrammarPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Grammar Redirect",
  description: "Redirects visitors to the primary localized grammar route.",
});

/**
 * Redirects the legacy grammar hub route to the preferred localized
 * destination.
 */
export default async function LegacyGrammarRedirectPage() {
  return redirectToPreferredLocale(getGrammarPath);
}
