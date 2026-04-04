import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { getPrivacyDocument } from "@/features/legal/lib/legalDocuments";
import { getTranslation } from "@/lib/i18n";
import { createLocalizedPageMetadata } from "@/lib/metadata";
import { getLocalizedHomePath, getPrivacyPath } from "@/lib/locale";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
import { createBreadcrumbStructuredData } from "@/lib/structuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);
  const document = getPrivacyDocument(resolvedLocale);

  return createLocalizedPageMetadata({
    title: document.title,
    description: document.description,
    path: "/privacy",
    locale: resolvedLocale,
  });
}

export default async function LocalizedPrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);
  const document = getPrivacyDocument(resolvedLocale);

  return (
    <>
      <StructuredData
        data={createBreadcrumbStructuredData([
          {
            name: getTranslation(resolvedLocale, "nav.home"),
            path: getLocalizedHomePath(resolvedLocale),
          },
          {
            name: document.title,
            path: getPrivacyPath(resolvedLocale),
          },
        ])}
      />
      <LegalDocumentPage
        {...document}
        breadcrumbItems={[
          {
            label: getTranslation(resolvedLocale, "nav.home"),
            href: getLocalizedHomePath(resolvedLocale),
          },
          { label: document.title },
        ]}
      />
    </>
  );
}
