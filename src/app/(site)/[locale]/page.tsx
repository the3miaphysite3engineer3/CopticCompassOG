import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import HomePageClient from "@/features/home/components/HomePageClient";
import { createLocalizedPageMetadata } from "@/lib/metadata";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
import { siteConfig } from "@/lib/site";
import { createWebSiteStructuredData } from "@/lib/structuredData";

function buildHomeDescription(locale: "en" | "nl") {
  if (locale === "nl") {
    return siteConfig.dictionaryEntryCount
      ? `Verken Coptic Compass: een digitaal thuis voor de studie van het Koptisch met ${siteConfig.dictionaryEntryCount.toLocaleString()} doorzoekbare woordenboeklemma's, grammaticalessen, publicaties en leertools.`
      : "Verken Coptic Compass: een digitaal thuis voor de studie van het Koptisch met een doorzoekbaar woordenboek, grammaticalessen, publicaties en leertools.";
  }

  return siteConfig.dictionaryEntryCount
    ? `Explore Coptic Compass, a digital home for Coptic study with ${siteConfig.dictionaryEntryCount.toLocaleString()} searchable dictionary entries, grammar lessons, publications, and learning tools.`
    : "Explore Coptic Compass, a digital home for Coptic study with a searchable dictionary, grammar lessons, publications, and learning tools.";
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
        ? "Koptisch Woordenboek, Grammatica en Publicaties"
        : "Coptic Dictionary, Grammar, and Publications",
    description: buildHomeDescription(resolvedLocale),
    path: "/",
    locale: resolvedLocale,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);

  return (
    <>
      <StructuredData data={createWebSiteStructuredData(resolvedLocale)} />
      <HomePageClient />
    </>
  );
}
