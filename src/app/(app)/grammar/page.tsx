import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGrammarPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Grammar Redirect",
  description: "Redirects visitors to the primary localized grammar route.",
});

export default async function LegacyGrammarRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getGrammarPath(preferredLanguage));
}
