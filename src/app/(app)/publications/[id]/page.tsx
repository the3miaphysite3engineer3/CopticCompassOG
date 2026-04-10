import { getPublicationPath } from "@/features/publications/lib/publications";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocaleWithParams } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Publication Redirect",
  description: "Redirects visitors to the localized publication detail route.",
});

/**
 * Redirects the legacy publication-detail route to the preferred localized
 * destination while preserving the publication id.
 */
export default async function LegacyPublicationDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return redirectToPreferredLocaleWithParams(params, ({ id }, locale) =>
    getPublicationPath(id, locale),
  );
}
