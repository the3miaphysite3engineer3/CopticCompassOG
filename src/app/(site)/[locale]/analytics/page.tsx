import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import AnalyticsPageClient from "@/features/analytics/components/AnalyticsPageClient";
import { createAnalyticsSnapshots } from "@/features/analytics/lib/analytics";
import { getDictionary } from "@/features/dictionary/lib/dictionary";
import { getTranslation } from "@/lib/i18n";
import { createLocalizedPageMetadata } from "@/lib/metadata";
import {
  getAnalyticsPath,
  getDictionaryPath,
  getLocalizedHomePath,
} from "@/lib/locale";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
import { createBreadcrumbStructuredData } from "@/lib/structuredData";

function buildAnalyticsDescription(locale: "en" | "nl") {
  return locale === "nl"
    ? "Verken statistieken voor het Koptische woordenboek, waaronder woordsoorten, geslachten van zelfstandige naamwoorden en andere lexicale verdelingen."
    : "Explore analytics for the Coptic dictionary, including parts of speech, noun genders, and other lexical distribution patterns.";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);

  return createLocalizedPageMetadata({
    title:
      resolvedLocale === "nl"
        ? "Woordenboekstatistieken"
        : "Dictionary Analytics",
    description: buildAnalyticsDescription(resolvedLocale),
    path: "/analytics",
    locale: resolvedLocale,
  });
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);
  const dictionary = getDictionary();
  return (
    <>
      <StructuredData
        data={createBreadcrumbStructuredData([
          {
            name: getTranslation(resolvedLocale, "nav.home"),
            path: getLocalizedHomePath(resolvedLocale),
          },
          {
            name: getTranslation(resolvedLocale, "nav.dictionary"),
            path: getDictionaryPath(resolvedLocale),
          },
          {
            name: getTranslation(resolvedLocale, "nav.analytics"),
            path: getAnalyticsPath(resolvedLocale),
          },
        ])}
      />
      <AnalyticsPageClient
        snapshots={createAnalyticsSnapshots(dictionary)}
        dictionary={dictionary}
      />
    </>
  );
}
