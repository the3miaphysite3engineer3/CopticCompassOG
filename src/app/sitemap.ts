import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";
import { getDictionary } from "@/features/dictionary/lib/dictionary";
import { listPublishedGrammarLessons } from "@/features/grammar/lib/grammarDataset";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import {
  getPublicationPath,
  publications,
} from "@/features/publications/lib/publications";
import {
  getAnalyticsPath,
  getContactPath,
  getDevelopersPath,
  getDictionaryPath,
  getEntryPath,
  getGrammarPath,
  getLocalizedHomePath,
  getPublicationsPath,
  PUBLIC_LOCALES,
} from "@/lib/locale";
import { siteConfig } from "@/lib/site";
import type { Language } from "@/types/i18n";

type LocalizedStaticRouteConfig = {
  getRoute: (locale: Language) => string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  sourcePaths: readonly string[];
};

type StaticRouteConfig = {
  route: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  sourcePaths: readonly string[];
};

const localizedStaticRoutes: readonly LocalizedStaticRouteConfig[] = [
  {
    getRoute: getLocalizedHomePath,
    changeFrequency: "weekly",
    priority: 1,
    sourcePaths: [
      "src/app/(site)/[locale]/page.tsx",
      "src/app/(site)/[locale]/layout.tsx",
      "src/features/home/components/HomePageClient.tsx",
      "src/lib/site.ts",
    ],
  },
  {
    getRoute: getDictionaryPath,
    changeFrequency: "weekly",
    priority: 0.9,
    sourcePaths: [
      "src/app/(site)/[locale]/dictionary/page.tsx",
      "public/data/dictionary.json",
      "public/data/woordenboek.json",
    ],
  },
  {
    getRoute: getGrammarPath,
    changeFrequency: "weekly",
    priority: 0.8,
    sourcePaths: [
      "src/app/(site)/[locale]/grammar/page.tsx",
      "public/data/grammar/v1/manifest.json",
    ],
  },
  {
    getRoute: getPublicationsPath,
    changeFrequency: "monthly",
    priority: 0.8,
    sourcePaths: [
      "src/app/(site)/[locale]/publications/page.tsx",
      "src/features/publications/lib/publications.ts",
    ],
  },
  {
    getRoute: getContactPath,
    changeFrequency: "monthly",
    priority: 0.6,
    sourcePaths: ["src/app/(site)/[locale]/contact/page.tsx"],
  },
  {
    getRoute: getDevelopersPath,
    changeFrequency: "monthly",
    priority: 0.65,
    sourcePaths: [
      "src/app/(site)/[locale]/developers/page.tsx",
      "src/app/(app)/api-docs/page.tsx",
      "src/features/grammar/lib/grammarOpenApi.ts",
    ],
  },
  {
    getRoute: getAnalyticsPath,
    changeFrequency: "monthly",
    priority: 0.6,
    sourcePaths: [
      "src/app/(site)/[locale]/analytics/page.tsx",
      "public/data/dictionary.json",
    ],
  },
];

const staticRoutes: readonly StaticRouteConfig[] = [
  {
    route: "/api-docs",
    changeFrequency: "monthly",
    priority: 0.5,
    sourcePaths: [
      "src/app/(app)/api-docs/page.tsx",
      "src/features/grammar/lib/grammarOpenApi.ts",
    ],
  },
  {
    route: "/privacy",
    changeFrequency: "yearly",
    priority: 0.2,
    sourcePaths: ["src/app/(app)/privacy/page.tsx"],
  },
  {
    route: "/terms",
    changeFrequency: "yearly",
    priority: 0.2,
    sourcePaths: ["src/app/(app)/terms/page.tsx"],
  },
];

function getLastModified(sourcePaths: readonly string[]) {
  const modifiedTimestamps = sourcePaths
    .map((sourcePath) => path.join(process.cwd(), sourcePath))
    .filter((absolutePath) => fs.existsSync(absolutePath))
    .map((absolutePath) => fs.statSync(absolutePath).mtime.getTime());

  if (modifiedTimestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...modifiedTimestamps));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const dictionary = getDictionary();
  const dictionaryLastModified = getLastModified([
    "public/data/dictionary.json",
    "public/data/woordenboek.json",
  ]);
  const publicationsLastModified = getLastModified([
    "src/features/publications/lib/publications.ts",
    "src/app/(site)/[locale]/publications/[id]/page.tsx",
    "src/features/publications/components/PublicationDetailPageClient.tsx",
  ]);
  const grammarLessonPages = PUBLIC_LOCALES.flatMap((locale) =>
    listPublishedGrammarLessons().map((lesson) => {
      const lastModified = getLastModified([
        "src/app/(site)/[locale]/grammar/[slug]/page.tsx",
        `public/data/grammar/v1/lessons/${lesson.slug}.json`,
        "public/data/grammar/v1/manifest.json",
      ]);

      return {
        url: `${siteConfig.liveUrl}${getGrammarLessonPath(lesson.slug, locale)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.78,
      };
    }),
  );

  const localizedStaticPages = PUBLIC_LOCALES.flatMap((locale) =>
    localizedStaticRoutes.map((route) => {
      const lastModified = getLastModified(route.sourcePaths);

      return {
        url: `${siteConfig.liveUrl}${route.getRoute(locale)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      };
    }),
  ) satisfies MetadataRoute.Sitemap;

  const staticPages = staticRoutes.map((route) => {
    const lastModified = getLastModified([
      ...route.sourcePaths,
    ]);

    return {
      url: `${siteConfig.liveUrl}${route.route}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  }) satisfies MetadataRoute.Sitemap;

  const entryPages = PUBLIC_LOCALES.flatMap((locale) =>
    dictionary.map((entry) => ({
      url: `${siteConfig.liveUrl}${getEntryPath(entry.id, locale)}`,
      ...(dictionaryLastModified ? { lastModified: dictionaryLastModified } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  );

  const publicationPages = PUBLIC_LOCALES.flatMap((locale) =>
    publications.map((publication) => ({
      url: `${siteConfig.liveUrl}${getPublicationPath(publication.id, locale)}`,
      ...(publicationsLastModified ? { lastModified: publicationsLastModified } : {}),
      changeFrequency: "monthly" as const,
      priority: publication.status === "published" ? 0.75 : 0.65,
    })),
  );

  return [
    ...localizedStaticPages,
    ...staticPages,
    ...entryPages,
    ...publicationPages,
    ...grammarLessonPages,
  ];
}
