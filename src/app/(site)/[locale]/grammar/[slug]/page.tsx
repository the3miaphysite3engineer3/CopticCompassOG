import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StructuredData from "@/components/StructuredData";
import { getDictionary } from "@/features/dictionary/lib/dictionary";
import { GrammarLessonPageClient } from "@/features/grammar/components/GrammarLessonPageClient";
import {
  buildGrammarLessonSeoDescription,
  buildGrammarLessonSeoTitle,
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import { listRankedDictionaryEntryIdsForPublishedLesson } from "@/features/grammar/lib/grammarContentGraph";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import {
  createLanguageAlternates,
  getGrammarPath,
  getLocalizedHomePath,
  getOpenGraphLocale,
  isPublicLocale,
} from "@/lib/locale";
import { buildPageTitle, siteConfig } from "@/lib/site";
import {
  createBreadcrumbStructuredData,
  createGrammarLessonStructuredData,
} from "@/lib/structuredData";

export const dynamicParams = false;

export async function generateStaticParams() {
  return listPublishedGrammarLessons().map((lesson) => ({
    slug: lesson.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = isPublicLocale(resolvedParams.locale)
    ? resolvedParams.locale
    : "en";
  const lessonBundle = getPublishedGrammarLessonBundleBySlug(resolvedParams.slug);

  if (!lessonBundle) {
    return {
      title: "Grammar Lesson Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = buildGrammarLessonSeoTitle(lessonBundle.lesson);
  const description = buildGrammarLessonSeoDescription(lessonBundle);
  const path = getGrammarLessonPath(lessonBundle.lesson.slug, locale);

  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title,
    description,
    alternates: {
      canonical: path,
      languages: createLanguageAlternates(`/grammar/${lessonBundle.lesson.slug}`),
    },
    openGraph: {
      title: buildPageTitle(title),
      description,
      url: `${siteConfig.liveUrl}${path}`,
      locale: getOpenGraphLocale(locale),
    },
    twitter: {
      title: buildPageTitle(title),
      description,
    },
  };
}

export default async function GrammarLessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = isPublicLocale(resolvedParams.locale)
    ? resolvedParams.locale
    : "en";
  const lessonBundle = getPublishedGrammarLessonBundleBySlug(resolvedParams.slug);

  if (!lessonBundle) {
    notFound();
  }

  const lessonPath = getGrammarLessonPath(lessonBundle.lesson.slug, locale);
  const dictionaryById = new Map(
    getDictionary(locale).map((entry) => [entry.id, entry] as const),
  );
  const linkedEntries = listRankedDictionaryEntryIdsForPublishedLesson(
    lessonBundle.lesson.slug,
  )
    .map((entryId) => dictionaryById.get(entryId))
    .filter((entry) => entry !== undefined);

  return (
    <>
      <StructuredData
        data={[
          createBreadcrumbStructuredData([
            { name: "Home", path: getLocalizedHomePath(locale) },
            { name: "Grammar", path: getGrammarPath(locale) },
            { name: lessonBundle.lesson.title.en, path: lessonPath },
          ]),
          createGrammarLessonStructuredData(lessonBundle, locale),
        ]}
      />
      <GrammarLessonPageClient
        lessonBundle={lessonBundle}
        linkedEntries={linkedEntries}
      />
    </>
  );
}
