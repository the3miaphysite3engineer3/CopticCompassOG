import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StructuredData from "@/components/StructuredData";
import { GrammarLessonPageClient } from "@/features/grammar/components/GrammarLessonPageClient";
import {
  buildGrammarLessonSeoDescription,
  buildGrammarLessonSeoTitle,
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import {
  createLanguageAlternates,
  getGrammarPath,
  getLocalizedHomePath,
  getOpenGraphLocale,
} from "@/lib/locale";
import { getTranslation } from "@/lib/i18n";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
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
  const locale = resolvePublicLocale(resolvedParams.locale);
  const lessonBundle = getPublishedGrammarLessonBundleBySlug(
    resolvedParams.slug,
  );

  if (!lessonBundle) {
    return {
      title:
        locale === "nl"
          ? "Grammaticales niet gevonden"
          : "Grammar Lesson Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = buildGrammarLessonSeoTitle(lessonBundle.lesson, locale);
  const description = buildGrammarLessonSeoDescription(lessonBundle, locale);
  const path = getGrammarLessonPath(lessonBundle.lesson.slug, locale);

  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title,
    description,
    alternates: {
      canonical: path,
      languages: createLanguageAlternates(
        `/grammar/${lessonBundle.lesson.slug}`,
      ),
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
  const locale = resolvePublicLocale(resolvedParams.locale);
  const lessonBundle = getPublishedGrammarLessonBundleBySlug(
    resolvedParams.slug,
  );

  if (!lessonBundle) {
    notFound();
  }

  const lessonPath = getGrammarLessonPath(lessonBundle.lesson.slug, locale);
  const publishedLessons = listPublishedGrammarLessons();
  const currentLessonIndex = publishedLessons.findIndex(
    (lesson) => lesson.slug === lessonBundle.lesson.slug,
  );
  const previousLessonIndexItem =
    currentLessonIndex > 0 ? publishedLessons[currentLessonIndex - 1] : null;
  const nextLessonIndexItem =
    currentLessonIndex >= 0 && currentLessonIndex < publishedLessons.length - 1
      ? publishedLessons[currentLessonIndex + 1]
      : null;

  return (
    <>
      <StructuredData
        data={[
          createBreadcrumbStructuredData([
            {
              name: getTranslation(locale, "nav.home"),
              path: getLocalizedHomePath(locale),
            },
            {
              name: getTranslation(locale, "nav.grammar"),
              path: getGrammarPath(locale),
            },
            { name: lessonBundle.lesson.title[locale], path: lessonPath },
          ]),
          createGrammarLessonStructuredData(lessonBundle, locale),
        ]}
      />
      <GrammarLessonPageClient
        lessonBundle={lessonBundle}
        previousLesson={
          previousLessonIndexItem
            ? {
                href: getGrammarLessonPath(
                  previousLessonIndexItem.slug,
                  locale,
                ),
                number: previousLessonIndexItem.number,
                title: previousLessonIndexItem.title[locale],
              }
            : null
        }
        nextLesson={
          nextLessonIndexItem
            ? {
                href: getGrammarLessonPath(nextLessonIndexItem.slug, locale),
                number: nextLessonIndexItem.number,
                title: nextLessonIndexItem.title[locale],
              }
            : null
        }
      />
    </>
  );
}
