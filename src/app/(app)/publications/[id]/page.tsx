import type { Metadata } from "next";
import { getPublicationPath } from "@/features/publications/lib/publications";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocaleWithParams } from "@/lib/publicLocaleRouting";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Publication Redirect",
  description: "Redirects visitors to the localized publication detail route.",
});

export default async function LegacyPublicationDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return redirectToPreferredLocaleWithParams(params, ({ id }, locale) =>
    getPublicationPath(id, locale),
  );
}
