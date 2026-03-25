import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDevelopersPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Developers Redirect",
  description: "Redirects visitors to the primary localized developer guide.",
});

export default async function LegacyDevelopersRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getDevelopersPath(preferredLanguage));
}
