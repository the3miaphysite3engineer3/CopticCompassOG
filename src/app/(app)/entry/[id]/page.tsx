import type { Metadata } from "next";
import { getEntryPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocaleWithParams } from "@/lib/publicLocaleRouting";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Entry Redirect",
  description: "Redirects visitors to the localized dictionary entry route.",
});

export default async function LegacyEntryRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return redirectToPreferredLocaleWithParams(params, ({ id }, locale) =>
    getEntryPath(id, locale),
  );
}
