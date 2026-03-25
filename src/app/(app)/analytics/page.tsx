import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAnalyticsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Analytics Redirect",
  description: "Redirects visitors to the primary localized analytics route.",
});

export default async function LegacyAnalyticsRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getAnalyticsPath(preferredLanguage));
}
