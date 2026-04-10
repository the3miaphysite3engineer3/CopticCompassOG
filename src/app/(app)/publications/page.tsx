import { getPublicationsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Publications Redirect",
  description:
    "Redirects visitors to the primary localized publications route.",
});

/**
 * Redirects the legacy publications route to the preferred localized
 * destination.
 */
export default async function LegacyPublicationsRedirectPage() {
  return redirectToPreferredLocale(getPublicationsPath);
}
