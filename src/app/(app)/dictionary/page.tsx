import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionaryPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Dictionary Redirect",
  description: "Redirects visitors to the primary localized dictionary route.",
});

export default async function LegacyDictionaryRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getDictionaryPath(preferredLanguage));
}
