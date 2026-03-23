import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getDevelopersPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Developers Redirect",
  description: "Redirects visitors to the primary localized developer guide.",
});

export default function LegacyDevelopersRedirectPage() {
  permanentRedirect(getDevelopersPath("en"));
}
