import { describe, expect, it } from "vitest";

import {
  createLocalizedPageMetadata,
  createNoIndexMetadata,
  createRootLayoutMetadata,
} from "./metadata";
import { siteConfig } from "./site";

describe("metadata helpers", () => {
  it("builds localized page metadata with canonical and language alternates", () => {
    const metadata = createLocalizedPageMetadata({
      title: "Dictionary",
      description: "Search the dictionary",
      path: "/dictionary",
      locale: "nl",
    });

    expect(metadata.metadataBase?.toString()).toBe(`${siteConfig.liveUrl}/`);
    expect(metadata.alternates).toEqual({
      canonical: "/nl/dictionary",
      languages: {
        en: "/en/dictionary",
        nl: "/nl/dictionary",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      url: `${siteConfig.liveUrl}/nl/dictionary`,
      locale: "nl_BE",
    });
    expect(metadata.twitter).toMatchObject({
      title: "Dictionary | Coptic Compass",
    });
  });

  it("marks noindex metadata as non-indexable", () => {
    const metadata = createNoIndexMetadata({
      title: "Private Area",
      description: "Should not be indexed",
    });

    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("builds root layout metadata with locale-aware social information", () => {
    const metadata = createRootLayoutMetadata("en");

    expect(metadata.title).toMatchObject({
      default: siteConfig.title,
      template: `%s | ${siteConfig.brandName}`,
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "en_US",
      siteName: siteConfig.brandName,
      url: `${siteConfig.liveUrl}/en`,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      creator: siteConfig.author.twitter,
    });
  });
});
