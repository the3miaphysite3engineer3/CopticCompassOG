import { getPrivacyPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Privacy Redirect",
  description: "Redirects visitors to the primary localized privacy route.",
});

/**
 * Redirects the legacy privacy route to the preferred localized destination.
 */
export default async function LegacyPrivacyRedirectPage() {
  return redirectToPreferredLocale(getPrivacyPath);
}
