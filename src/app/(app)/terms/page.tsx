import { getTermsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Terms Redirect",
  description: "Redirects visitors to the primary localized terms route.",
});

/**
 * Redirects the legacy terms route to the preferred localized destination.
 */
export default async function LegacyTermsRedirectPage() {
  return redirectToPreferredLocale(getTermsPath);
}
