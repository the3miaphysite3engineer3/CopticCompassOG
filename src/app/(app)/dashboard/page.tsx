import type { Metadata } from "next";
import { getDashboardPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocale } from "@/lib/publicLocaleRouting";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Dashboard Redirect",
  description: "Redirects visitors to the localized dashboard route.",
});

export default async function DashboardPage() {
  return redirectToPreferredLocale(getDashboardPath);
}
