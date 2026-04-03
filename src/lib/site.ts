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

export const siteConfig = {
  name: "Coptic Compass | Coptic Dictionary, Grammar, and Publications",
  title: "Coptic Compass | Coptic Dictionary, Grammar, and Publications",
  description: dictionaryEntryCount
    ? `Digital Coptic dictionary, grammar lessons, publications, and research tools by Kyrillos Wannes, featuring ${dictionaryEntryCount.toLocaleString()} searchable entries.`
    : "Digital Coptic dictionary, grammar lessons, publications, and research tools by Kyrillos Wannes.",
  liveUrl: "https://kyrilloswannes.com",
  repoUrl: "https://github.com/KyroHub/portfolio",
  cloneUrl: "https://github.com/KyroHub/portfolio.git",
  author: {
    name: "Kyrillos Wannes",
    twitter: "@kyrilloswannes",
    github: "https://github.com/KyroHub",
  },
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
  return `${title} | ${siteConfig.name}`;
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
