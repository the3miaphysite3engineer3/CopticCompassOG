import type { Metadata } from "next";
import {
  createLanguageAlternates,
  getLocalizedPath,
  getOpenGraphLocale,
} from "@/lib/locale";
import { buildPageTitle, siteConfig } from "@/lib/site";
import type { Language } from "@/types/i18n";

function getSocialImages() {
  return [
    {
      url: `${siteConfig.liveUrl}/api/og`,
      width: 1200,
      height: 630,
      alt: "Coptic Compass social preview",
    },
  ];
}

export function createRootLayoutMetadata(locale: Language): Metadata {
  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.brandName}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.brandName,
    keywords: siteConfig.keywords,
    authors: [
      {
        name: siteConfig.author.name,
        url: siteConfig.author.github,
      },
    ],
    creator: siteConfig.author.name,
    publisher: siteConfig.brandName,
    category: "education",
    openGraph: {
      type: "website",
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.brandName,
      locale: getOpenGraphLocale(locale),
      url: `${siteConfig.liveUrl}${getLocalizedPath(locale)}`,
      images: getSocialImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      creator: siteConfig.author.twitter,
      images: getSocialImages().map((image) => image.url),
    },
  };
}

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: buildPageTitle(title),
      description,
      url: `${siteConfig.liveUrl}${path}`,
      images: getSocialImages(),
    },
    twitter: {
      title: buildPageTitle(title),
      description,
      images: getSocialImages().map((image) => image.url),
    },
  };
}

export function createLocalizedPageMetadata({
  title,
  description,
  path,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  locale: Language;
}): Metadata {
  const localizedPath = getLocalizedPath(locale, path);

  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title,
    description,
    alternates: {
      canonical: localizedPath,
      languages: createLanguageAlternates(path),
    },
    openGraph: {
      title: buildPageTitle(title),
      description,
      url: `${siteConfig.liveUrl}${localizedPath}`,
      locale: getOpenGraphLocale(locale),
      images: getSocialImages(),
    },
    twitter: {
      title: buildPageTitle(title),
      description,
      images: getSocialImages().map((image) => image.url),
    },
  };
}

export function createNoIndexMetadata({
  title,
  description,
}: {
  title: string;
  description?: string;
}): Metadata {
  return {
    metadataBase: new URL(siteConfig.liveUrl),
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}
