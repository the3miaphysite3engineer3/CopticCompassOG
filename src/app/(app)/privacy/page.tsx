import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPrivacyPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Privacy Redirect",
  description: "Redirects visitors to the primary localized privacy route.",
});

export default async function LegacyPrivacyRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getPrivacyPath(preferredLanguage));
}
