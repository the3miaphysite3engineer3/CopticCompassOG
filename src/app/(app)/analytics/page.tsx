import { getAnalyticsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Analytics Redirect",
  description: "Redirects visitors to the primary localized analytics route.",
});

/**
 * Redirects the legacy analytics route to the preferred localized destination.
 */
export default async function LegacyAnalyticsRedirectPage() {
  return redirectToPreferredLocale(getAnalyticsPath);
}
