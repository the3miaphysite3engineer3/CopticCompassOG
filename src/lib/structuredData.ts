import type {
  GrammarLessonBundle,
  GrammarLessonIndexItem,
} from "@/content/grammar/schema";
import {
  buildEntryDescription,
  toPlainText,
} from "@/features/dictionary/lib/entryText";
import type { LexicalEntry } from "@/features/dictionary/types";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import {
  getDictionaryPath,
  getEntryPath,
  getGrammarPath,
  getLocalizedHomePath,
  getPublicationsPath,
} from "@/lib/locale";
import {
  buildGrammarLessonSeoDescription,
  buildGrammarLessonSeoTitle,
} from "@/features/grammar/lib/grammarDataset";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import {
  buildPublicationDescription,
  getPublicationPath,
  type Publication,
} from "@/features/publications/lib/publications";
import { siteConfig } from "@/lib/site";
import type { Language } from "@/types/i18n";

type JsonLd = Record<string, unknown>;
export type BreadcrumbStructuredDataItem = {
  name: string;
  path: string;
};

function absoluteUrl(path: string) {
  return new URL(path, siteConfig.liveUrl).toString();
}

function getWebsiteId(locale: Language) {
  return `${absoluteUrl(getLocalizedHomePath(locale))}#website`;
}

function getDictionaryUrl(locale: Language) {
  return absoluteUrl(getDictionaryPath(locale));
}

function getDictionarySetId(locale: Language) {
  return `${getDictionaryUrl(locale)}#defined-term-set`;
}

function getGrammarHubUrl(locale: Language) {
  return absoluteUrl(getGrammarPath(locale));
}

function getGrammarHubPageId(locale: Language) {
  return `${getGrammarHubUrl(locale)}#collection-page`;
}

function getGrammarHubListId(locale: Language) {
  return `${getGrammarHubUrl(locale)}#item-list`;
}

function getPublicationsPageId(locale: Language) {
  return `${absoluteUrl(getPublicationsPath(locale))}#collection-page`;
}

function getPublicationsListId(locale: Language) {
  return `${absoluteUrl(getPublicationsPath(locale))}#item-list`;
}

function getPublicationAbsoluteUrl(publication: Publication, locale: Language) {
  return absoluteUrl(getPublicationPath(publication.id, locale));
}

function getPublicationStructuredData(
  publication: Publication,
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd {
  const publicationUrl = getPublicationAbsoluteUrl(publication, locale);

  return {
    "@context": "https://schema.org",
    "@type": publication.schemaType,
    "@id": `${publicationUrl}#work`,
    url: publicationUrl,
    name: publication.title,
    ...(publication.subtitle
      ? {
          alternativeHeadline: publication.subtitle,
        }
      : {}),
    description: buildPublicationDescription(publication, locale),
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    inLanguage: languageCode(publication.lang),
    ...(publication.image
      ? {
          image: absoluteUrl(publication.image),
        }
      : {}),
    ...(publication.link
      ? {
          sameAs: publication.link,
        }
      : {}),
    ...(publication.status === "forthcoming"
      ? {
          creativeWorkStatus: "In preparation",
        }
      : {}),
    isPartOf: {
      "@id": getPublicationsPageId(locale),
    },
    mainEntityOfPage: publicationUrl,
  };
}

export function createBreadcrumbStructuredData(
  items: readonly BreadcrumbStructuredDataItem[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function languageCode(lang: Publication["lang"]) {
  switch (lang) {
    case "COP":
      return "cop";
    case "NL":
      return "nl";
    case "EN":
      return "en";
    default:
      return "en";
  }
}

export function createWebSiteStructuredData(
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd {
  const dictionaryUrl = getDictionaryUrl(locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": getWebsiteId(locale),
    url: absoluteUrl(getLocalizedHomePath(locale)),
    name: siteConfig.name,
    alternateName: "Kyrillos Wannes",
    description: siteConfig.description,
    inLanguage: ["en", "nl", "cop"],
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
      sameAs: [siteConfig.author.github],
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${dictionaryUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function createDictionaryPageStructuredData(
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd[] {
  const dictionaryUrl = getDictionaryUrl(locale);
  const dictionarySetId = getDictionarySetId(locale);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${dictionaryUrl}#collection-page`,
      url: dictionaryUrl,
      name: "Coptic Dictionary",
      description:
        "Search the Coptic-English dictionary by Coptic, English, or Greek, with dialect filters, grammatical detail, and a built-in virtual keyboard.",
      isPartOf: {
        "@id": getWebsiteId(locale),
      },
      mainEntity: {
        "@id": dictionarySetId,
      },
      about: [
        {
          "@type": "Language",
          name: "Coptic",
          alternateName: "cop",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": dictionarySetId,
      url: dictionaryUrl,
      name: "Coptic-English Dictionary",
      description:
        "A digital Coptic dictionary with English and Greek glosses, dialect forms, and grammatical annotations.",
      creator: {
        "@type": "Person",
        name: siteConfig.author.name,
      },
      inLanguage: ["cop", "en", "nl", "el"],
    },
  ];
}

export function createGrammarHubStructuredData(
  lessons: readonly GrammarLessonIndexItem[],
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd[] {
  const publishedLessons = lessons.filter((lesson) => lesson.status === "published");
  const grammarHubUrl = getGrammarHubUrl(locale);
  const grammarHubPageId = getGrammarHubPageId(locale);
  const grammarHubListId = getGrammarHubListId(locale);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": grammarHubPageId,
      url: grammarHubUrl,
      name: "Coptic Grammar Lessons",
      description:
        "Published Coptic grammar lessons with exercises, concept glossaries, and source notes by Kyrillos Wannes.",
      isPartOf: {
        "@id": getWebsiteId(locale),
      },
      mainEntity: {
        "@id": grammarHubListId,
      },
      about: [
        {
          "@type": "Language",
          name: "Coptic",
          alternateName: "cop",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": grammarHubListId,
      url: grammarHubUrl,
      name: "Published Coptic Grammar Lessons",
      itemListElement: publishedLessons.map((lesson, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(getGrammarLessonPath(lesson.slug, locale)),
        name: buildGrammarLessonSeoTitle(lesson),
      })),
    },
  ];
}

export function createGrammarLessonStructuredData(
  lessonBundle: GrammarLessonBundle,
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd {
  const lesson = lessonBundle.lesson;
  const lessonUrl = absoluteUrl(getGrammarLessonPath(lesson.slug, locale));

  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": `${lessonUrl}#learning-resource`,
    url: lessonUrl,
    name: buildGrammarLessonSeoTitle(lesson),
    description: buildGrammarLessonSeoDescription(lessonBundle),
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    educationalUse: "instruction",
    learningResourceType: "Grammar lesson",
    inLanguage: ["en", "nl", "cop"],
    keywords: lesson.tags.join(", "),
    isPartOf: {
      "@id": getGrammarHubPageId(locale),
    },
    about: [
      {
        "@type": "Language",
        name: "Coptic",
        alternateName: "cop",
      },
      ...lessonBundle.concepts.slice(0, 6).map((concept) => ({
        "@type": "DefinedTerm",
        name: concept.title.en,
      })),
    ],
    hasPart: lesson.sections.map((section) => ({
      "@type": "WebPageElement",
      name: section.title.en,
      position: section.order,
    })),
  };
}

export function createDefinedTermStructuredData(
  entry: LexicalEntry,
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd {
  const headword = toPlainText(entry.headword);
  const entryPath = getEntryPath(entry.id, locale);
  // Search engines benefit from seeing every distinct dialect spelling as an
  // alternate label for the same lexical entry.
  const alternateNames = Array.from(
    new Set(
      Object.values(entry.dialects)
        .flatMap((forms) => [
          forms.absolute,
          ...(forms.absoluteVariants ?? []),
          forms.nominal,
          forms.pronominal,
          forms.stative,
        ])
        .map((form) => toPlainText(form))
        .filter(Boolean)
    )
  );
  const additionalProperty = [
    {
      "@type": "PropertyValue",
      name: "Part of speech",
      value: entry.pos,
    },
    entry.gender
      ? {
          "@type": "PropertyValue",
          name: "Gender",
          value: entry.gender,
        }
      : null,
    entry.greek_equivalents.length > 0
      ? {
          "@type": "PropertyValue",
          name: "Greek equivalents",
          value: entry.greek_equivalents.join("; "),
        }
      : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${absoluteUrl(entryPath)}#defined-term`,
    url: absoluteUrl(entryPath),
    name: headword,
    alternateName: alternateNames,
    description: buildEntryDescription(entry),
    termCode: entry.id,
    inDefinedTermSet: {
      "@id": getDictionarySetId(locale),
    },
    inLanguage: "cop",
    mainEntityOfPage: absoluteUrl(entryPath),
    additionalProperty,
  };
}

export function createPublicationsStructuredData(
  publications: Publication[],
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd[] {
  const publicationsPageId = getPublicationsPageId(locale);
  const publicationsListId = getPublicationsListId(locale);
  const works = publications.map((publication) =>
    getPublicationStructuredData(publication, locale),
  );

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": publicationsPageId,
      url: absoluteUrl(getPublicationsPath(locale)),
      name: "Publications",
      description:
        "Books, reference works, and research projects by Kyrillos Wannes, including published and forthcoming Coptic language materials.",
      isPartOf: {
        "@id": getWebsiteId(locale),
      },
      mainEntity: {
        "@id": publicationsListId,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": publicationsListId,
      url: absoluteUrl(getPublicationsPath(locale)),
      name: "Publications by Kyrillos Wannes",
      itemListElement: publications.map((publication, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: getPublicationAbsoluteUrl(publication, locale),
        item: {
          "@id": `${getPublicationAbsoluteUrl(publication, locale)}#work`,
        },
      })),
    },
    ...works,
  ];
}

export function createPublicationStructuredData(
  publication: Publication,
  locale: Language = DEFAULT_LANGUAGE,
): JsonLd {
  return getPublicationStructuredData(publication, locale);
}
