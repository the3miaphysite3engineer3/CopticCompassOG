import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getDictionaryPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Dictionary Redirect",
  description: "Redirects visitors to the primary localized dictionary route.",
});

export default function LegacyDictionaryRedirectPage() {
  permanentRedirect(getDictionaryPath("en"));
}
