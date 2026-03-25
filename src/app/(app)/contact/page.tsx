import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContactPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Contact Redirect",
  description: "Redirects visitors to the primary localized contact route.",
});

export default async function LegacyContactRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getContactPath(preferredLanguage));
}
