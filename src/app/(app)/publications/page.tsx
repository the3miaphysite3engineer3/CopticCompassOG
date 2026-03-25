import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicationsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Publications Redirect",
  description: "Redirects visitors to the primary localized publications route.",
});

export default async function LegacyPublicationsRedirectPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getPublicationsPath(preferredLanguage));
}
