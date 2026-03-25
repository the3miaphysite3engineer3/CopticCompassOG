import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocalizedHomePath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Home Redirect",
  description: "Redirects visitors to the primary localized homepage.",
});

export default async function LegacyHomeRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getLocalizedHomePath(preferredLanguage));
}
