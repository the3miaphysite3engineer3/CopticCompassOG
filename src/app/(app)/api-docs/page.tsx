import { ApiDocsPageClient } from "@/features/api-docs/components/ApiDocsPageClient";
import { getTranslation } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();

  return createPageMetadata({
    title: getTranslation(language, "apiDocs.metadataTitle"),
    description: getTranslation(language, "apiDocs.metadataDescription"),
    path: "/api-docs",
  });
}

/**
 * Renders the Swagger-backed documentation page for the public grammar API.
 */
export default async function ApiDocsPage() {
  return <ApiDocsPageClient />;
}
