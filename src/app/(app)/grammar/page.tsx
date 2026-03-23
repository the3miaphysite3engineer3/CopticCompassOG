import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getGrammarPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Grammar Redirect",
  description: "Redirects visitors to the primary localized grammar route.",
});

export default function LegacyGrammarRedirectPage() {
  permanentRedirect(getGrammarPath("en"));
}
