import { getEntryPath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocaleWithParams } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Entry Redirect",
  description: "Redirects visitors to the localized dictionary entry route.",
});

/**
 * Redirects the legacy dictionary entry route to the preferred localized
 * destination while preserving the entry id.
 */
export default async function LegacyEntryRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return redirectToPreferredLocaleWithParams(params, ({ id }, locale) =>
    getEntryPath(id, locale),
  );
}
