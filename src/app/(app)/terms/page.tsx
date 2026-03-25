import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTermsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Terms Redirect",
  description: "Redirects visitors to the primary localized terms route.",
});

export default async function LegacyTermsRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getTermsPath(preferredLanguage));
}
