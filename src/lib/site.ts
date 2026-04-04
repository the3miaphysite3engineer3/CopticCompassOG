import { readProjectJsonFile } from "@/lib/server/projectFiles";

function getDictionaryEntryCount() {
  try {
    const dictionary = readProjectJsonFile<unknown[]>(
      "public/data/dictionary.json",
    );

    return Array.isArray(dictionary) ? dictionary.length : 0;
  } catch {
    return 0;
  }
}

const dictionaryEntryCount = getDictionaryEntryCount();
const siteAuthor = {
  name: "Kyrillos Wannes",
  twitter: "@kyrilloswannes",
  github: "https://github.com/KyroHub",
};

function buildSiteDescription(entryCount: number) {
  const searchableEntries = entryCount
    ? ` It currently includes ${entryCount.toLocaleString()} searchable entries.`
    : "";

  return `Coptic Compass is a digital home for Coptic study, bringing together a searchable dictionary, grammar lessons, publications, and research tools.${searchableEntries}`;
}

export const siteConfig = {
  brandName: "Coptic Compass",
  descriptor: "Coptic Dictionary, Grammar, and Publications",
  founderLine: `by ${siteAuthor.name}`,
  founderCreditLine: `Built by ${siteAuthor.name}`,
  name: "Coptic Compass",
  title: "Coptic Compass | Coptic Dictionary, Grammar, and Publications",
  shortDescription: "A digital home for Coptic study.",
  description: buildSiteDescription(dictionaryEntryCount),
  liveUrl: "https://kyrilloswannes.com",
  repoUrl: "https://github.com/KyroHub/CopticCompass",
  cloneUrl: "https://github.com/KyroHub/CopticCompass.git",
  author: siteAuthor,
  keywords: [
    "coptic",
    "linguistics",
    "dictionary",
    "digital humanities",
    "nextjs",
    "typescript",
    "tailwindcss",
    "recharts",
  ],
  dictionaryEntryCount,
};

export function buildPageTitle(title: string) {
  return `${title} | ${siteConfig.brandName}`;
}

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    siteConfig.liveUrl,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return new URL(candidate);
    } catch {
      continue;
    }
  }

  return undefined;
}
