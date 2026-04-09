import { getLocalizedPath } from "@/lib/locale";
import type { Language } from "@/types/i18n";

export type LanguageBadge = "COP" | "NL" | "EN";
export type PublicationSchemaType =
  | "Book"
  | "ScholarlyArticle"
  | "CreativeWork";
export type PublicationStatus = "published" | "forthcoming";

export interface Publication {
  id: string;
  title: string;
  subtitle?: string;
  lang: LanguageBadge;
  image?: string;
  link?: string;
  schemaType: PublicationSchemaType;
  status: PublicationStatus;
  summary: Record<Language, string>;
}

export const publications: Publication[] = [
  {
    id: "holy-bible-coptic",
    title: "The Holy Bible in Coptic",
    lang: "COP",
    image: "/publications/holy-bible-coptic.png",
    link: "https://www.amazon.com/dp/B0CBSKX4CZ",
    schemaType: "Book",
    status: "published",
    summary: {
      en: "A published Coptic edition of the Holy Bible, available as part of the growing publication catalog on Coptic Compass.",
      nl: "Een gepubliceerde Koptische editie van de Heilige Bijbel, beschikbaar als onderdeel van de groeiende publicatiecatalogus van Coptic Compass.",
    },
  },
  {
    id: "basisgrammatica-bohairisch-koptisch",
    title: "Inleiding tot het Bohairisch Koptisch: Basisgrammatica",
    subtitle: "Deel I (3 delen)",
    lang: "NL",
    schemaType: "Book",
    status: "forthcoming",
    summary: {
      en: "A forthcoming Dutch-language introduction to Bohairic Coptic grammar, designed as the first volume in a larger structured course.",
      nl: "Een aankomende Nederlandstalige inleiding tot het Bohairisch Koptisch, opgevat als het eerste deel van een grotere gestructureerde leergang.",
    },
  },
  {
    id: "bohairisch-nederlands-woordenboek",
    title:
      "Bohairisch–Nederlands Woordenboek: Een Beknopt Lexicon van het Koptisch",
    lang: "NL",
    schemaType: "Book",
    status: "forthcoming",
    summary: {
      en: "A forthcoming concise Bohairic-to-Dutch lexicon focused on practical reference use for students and researchers of Coptic.",
      nl: "Een aankomend beknopt Bohairisch-Nederlands lexicon, gericht op praktisch naslagwerk voor studenten en onderzoekers van het Koptisch.",
    },
  },
  {
    id: "complex-verb-constructions-coptic",
    title:
      "Complex Verb Constructions in Coptic: Lexical and Morphological Perspectives from Bohairic and Sahidic",
    lang: "EN",
    schemaType: "ScholarlyArticle",
    status: "forthcoming",
    summary: {
      en: "A forthcoming research article examining complex verbal constructions in Coptic through comparative Bohairic and Sahidic evidence.",
      nl: "Een aankomend onderzoeksartikel over complexe verbale constructies in het Koptisch op basis van vergelijkend Bohairisch en Sahidisch materiaal.",
    },
  },
  {
    id: "parallel-paradigms-coptic",
    title: "Parallel Paradigms of Bohairic and Sahidic Coptic",
    lang: "EN",
    schemaType: "ScholarlyArticle",
    status: "forthcoming",
    summary: {
      en: "A forthcoming comparative study mapping shared and divergent paradigms across Bohairic and Sahidic Coptic.",
      nl: "Een aankomende vergelijkende studie die gedeelde en uiteenlopende paradigma's in het Bohairisch en Sahidisch Koptisch in kaart brengt.",
    },
  },
  {
    id: "tales-and-legends-reader",
    title: "Tales and Legends: A Bohairic Coptic Reader",
    subtitle: "Vol. I",
    lang: "EN",
    schemaType: "Book",
    status: "forthcoming",
    summary: {
      en: "A forthcoming Bohairic Coptic reader built around narrative texts, designed to support extended reading practice.",
      nl: "Een aankomende Bohairische Koptische reader rond verhalende teksten, ontworpen om uitgebreid leeswerk te ondersteunen.",
    },
  },
  {
    id: "speak-with-us-coptic-curriculum",
    title: "Speak with Us: A Bohairic Coptic Curriculum",
    subtitle: "Translated by Kyrillos Wannes",
    lang: "EN",
    schemaType: "Book",
    status: "forthcoming",
    summary: {
      en: "A forthcoming Bohairic Coptic curriculum in translation, created to support guided language learning and classroom use.",
      nl: "Een aankomend vertaald curriculum voor het Bohairisch Koptisch, bedoeld om begeleid taalonderwijs en klassikaal gebruik te ondersteunen.",
    },
  },
];

/**
 * Returns the localized publications route for a publication id.
 */
export function getPublicationPath(id: string, locale?: Language) {
  const path = `/publications/${id}`;
  return locale ? getLocalizedPath(locale, path) : path;
}

/**
 * Loads one publication definition from the in-repo publications catalog.
 */
export function getPublicationById(id: string) {
  return publications.find((publication) => publication.id === id) ?? null;
}

/**
 * Returns related publications by preferring shared language and schema type
 * before truncating the list to the requested limit.
 */
export function getRelatedPublications(id: string, limit = 3) {
  const currentPublication = getPublicationById(id);

  if (!currentPublication) {
    return [];
  }

  return publications
    .filter((publication) => publication.id !== id)
    .sort((left, right) => {
      const leftScore =
        Number(left.lang === currentPublication.lang) +
        Number(left.schemaType === currentPublication.schemaType);
      const rightScore =
        Number(right.lang === currentPublication.lang) +
        Number(right.schemaType === currentPublication.schemaType);

      return rightScore - leftScore;
    })
    .slice(0, limit);
}

/**
 * Builds the display title used across metadata and publication detail views.
 */
export function buildPublicationTitle(publication: Publication) {
  return publication.subtitle
    ? `${publication.title}: ${publication.subtitle}`
    : publication.title;
}

/**
 * Builds the localized publication description used by metadata and share
 * surfaces from the summary, format, availability, and author details.
 */
export function buildPublicationDescription(
  publication: Publication,
  locale: Language = "en",
) {
  let formatLabel = locale === "nl" ? "creatief werk" : "creative work";

  if (publication.schemaType === "Book") {
    formatLabel = locale === "nl" ? "boek" : "book";
  } else if (publication.schemaType === "ScholarlyArticle") {
    formatLabel = locale === "nl" ? "onderzoeksartikel" : "research article";
  }

  let availabilityLabel =
    locale === "nl" ? "Binnenkort beschikbaar." : "Forthcoming.";

  if (publication.status === "published") {
    availabilityLabel = locale === "nl" ? "Nu beschikbaar." : "Available now.";
  }
  const authorLabel = locale === "nl" ? "door" : "by";
  const platformLabel =
    locale === "nl" ? "via Coptic Compass" : "available through Coptic Compass";

  return `${buildPublicationTitle(publication)}. ${publication.summary[locale]} ${availabilityLabel} ${formatLabel} ${platformLabel}. ${authorLabel} Kyrillos Wannes.`;
}
