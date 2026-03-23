import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getPublicationsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Publications Redirect",
  description: "Redirects visitors to the primary localized publications route.",
});

export default function LegacyPublicationsRedirectPage() {
  permanentRedirect(getPublicationsPath("en"));
}
