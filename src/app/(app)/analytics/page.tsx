import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getAnalyticsPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Analytics Redirect",
  description: "Redirects visitors to the primary localized analytics route.",
});

export default function LegacyAnalyticsRedirectPage() {
  permanentRedirect(getAnalyticsPath("en"));
}
