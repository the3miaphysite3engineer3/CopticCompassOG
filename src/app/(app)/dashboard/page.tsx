import { getDashboardPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Dashboard Redirect",
  description: "Redirects visitors to the localized dashboard route.",
});

/**
 * Redirects the legacy dashboard route to the preferred localized destination.
 */
export default async function DashboardPage() {
  return redirectToPreferredLocale(getDashboardPath);
}
