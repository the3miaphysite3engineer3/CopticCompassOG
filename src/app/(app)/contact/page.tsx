import { getContactPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Contact Redirect",
  description: "Redirects visitors to the primary localized contact route.",
});

/**
 * Redirects the legacy contact route to the preferred localized destination.
 */
export default async function LegacyContactRedirectPage() {
  return redirectToPreferredLocale(getContactPath);
}
