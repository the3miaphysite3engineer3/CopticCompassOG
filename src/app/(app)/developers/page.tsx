import { getDevelopersPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Developers Redirect",
  description: "Redirects visitors to the primary localized developer guide.",
});

/**
 * Redirects the legacy developers route to the preferred localized destination.
 */
export default async function LegacyDevelopersRedirectPage() {
  return redirectToPreferredLocale(getDevelopersPath);
}
