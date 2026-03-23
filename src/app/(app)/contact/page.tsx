import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getContactPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Contact Redirect",
  description: "Redirects visitors to the primary localized contact route.",
});

export default function LegacyContactRedirectPage() {
  permanentRedirect(getContactPath("en"));
}
