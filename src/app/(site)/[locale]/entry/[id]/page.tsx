import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EntryPageHeader from "@/features/dictionary/components/EntryPageHeader";
import EntryPageClient from "@/features/dictionary/components/EntryPageClient";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import StructuredData from "@/components/StructuredData";
import { buildEntryOpenGraphImageUrl } from "@/features/dictionary/lib/entryOpenGraph";
import {
  buildEntryDescription,
  toPlainText,
} from "@/features/dictionary/lib/entryText";
import {
  getDictionary,
  getDictionaryEntryRelations,
} from "@/features/dictionary/lib/dictionary";
import { listPublishedGrammarLessonsForEntry } from "@/features/grammar/lib/grammarContentGraph";
import {
  createLanguageAlternates,
  getDictionaryPath,
  getEntryPath,
  getLocalizedHomePath,
} from "@/lib/locale";
import { getTranslation } from "@/lib/i18n";
import { createPageSocialMetadata, createSocialImage } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
import {
  createBreadcrumbStructuredData,
  createDefinedTermStructuredData,
} from "@/lib/structuredData";

// Render dictionary entries on demand so the deployment stays within output
// size limits while preserving stable, crawlable metadata per entry.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvePublicLocale(resolvedParams.locale);
  const dictionary = getDictionary();
  const entry = dictionary.find((item) => item.id === resolvedParams.id);

  if (!entry) {
    return {
      title: locale === "nl" ? "Lemma niet gevonden" : "Entry Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const headword = toPlainText(entry.headword);
  const title =
    locale === "nl"
      ? `${headword} (${entry.pos}) - Koptisch Woordenboek`
      : `${headword} (${entry.pos}) - Coptic Dictionary`;
  const description = buildEntryDescription(entry, locale);
  const path = getEntryPath(entry.id, locale);
  const imageUrl = buildEntryOpenGraphImageUrl(entry.id, locale);
  const image = createSocialImage(
    imageUrl,
    locale === "nl"
      ? `${headword} | ${siteConfig.brandName} woordenboeklemma`
      : `${headword} | ${siteConfig.brandName} dictionary entry`,
  );

  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title,
    description,
    alternates: {
      canonical: path,
      languages: createLanguageAlternates(`/entry/${entry.id}`),
    },
    ...createPageSocialMetadata({
      title,
      description,
      path,
      locale,
      images: [image],
    }),
  };
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvePublicLocale(resolvedParams.locale);
  const dictionary = getDictionary();
  const entry = dictionary.find((e) => e.id === resolvedParams.id);

  if (!entry) {
    notFound();
  }

  const { parentEntry, relatedEntries } = getDictionaryEntryRelations(
    entry,
    dictionary,
  );
  const headword = toPlainText(entry.headword);
  const relatedGrammarLessons = listPublishedGrammarLessonsForEntry(entry.id);

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 pb-20 md:p-10"
      contentClassName="w-full pt-10"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbOffset,
      ]}
    >
      <StructuredData
        data={[
          createBreadcrumbStructuredData([
            {
              name: getTranslation(locale, "nav.home"),
              path: getLocalizedHomePath(locale),
            },
            {
              name: getTranslation(locale, "nav.dictionary"),
              path: getDictionaryPath(locale),
            },
            { name: headword, path: getEntryPath(entry.id, locale) },
          ]),
          createDefinedTermStructuredData(entry, locale),
        ]}
      />

      <EntryPageHeader entryLabel={headword} />
      <EntryPageClient
        initialEntry={entry}
        initialParentEntry={parentEntry}
        initialRelatedEntries={relatedEntries}
        relatedGrammarLessons={relatedGrammarLessons}
      />
    </PageShell>
  );
}
