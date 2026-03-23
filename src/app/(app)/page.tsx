import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getLocalizedHomePath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Home Redirect",
  description: "Redirects visitors to the primary localized homepage.",
});

export default function LegacyHomeRedirectPage() {
  permanentRedirect(getLocalizedHomePath("en"));
}
