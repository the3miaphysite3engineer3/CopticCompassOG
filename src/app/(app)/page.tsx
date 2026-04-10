import { getLocalizedHomePath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Home Redirect",
  description: "Redirects visitors to the primary localized homepage.",
});

/**
 * Redirects the legacy root route to the preferred localized homepage.
 */
export default async function LegacyHomeRedirectPage() {
  return redirectToPreferredLocale(getLocalizedHomePath);
}
