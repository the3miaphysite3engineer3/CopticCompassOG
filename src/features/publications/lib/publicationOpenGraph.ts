import {
  buildPublicationTitle,
  type Publication,
} from "@/features/publications/lib/publications";
import {
  buildOpenGraphImageUrl,
  getOpenGraphSectionFooter,
} from "@/features/seo/lib/openGraph";
import type { Language } from "@/types/i18n";

type PublicationOpenGraphPreview = {
  eyebrow: string;
  footerLabel: string;
  languageLabel: string;
  statusLabel: string;
  subtitle?: string;
  summary: string;
  title: string;
};

/**
 * Returns the localized availability label shown on publication preview cards.
 */
function getPublicationStatusLabel(publication: Publication, locale: Language) {
  if (locale === "nl") {
    return publication.status === "published" ? "Nu beschikbaar" : "Binnenkort";
  }

  return publication.status === "published" ? "Available now" : "Forthcoming";
}

/**
 * Builds the `/api/og` image URL for one publication preview card.
 */
export function buildPublicationOpenGraphImageUrl(
  publicationId: string,
  language: Language,
  baseUrl?: string,
) {
  return buildOpenGraphImageUrl({
    baseUrl,
    id: publicationId,
    locale: language,
    type: "publication",
  });
}

/**
 * Builds the publication Open Graph preview payload with localized status and
 * summary metadata.
 */
export function buildPublicationOpenGraphPreview(
  publication: Publication,
  locale: Language,
): PublicationOpenGraphPreview {
  return {
    eyebrow: locale === "nl" ? "Publicaties" : "Publications",
    footerLabel: getOpenGraphSectionFooter("publications", locale),
    languageLabel: publication.lang,
    statusLabel: getPublicationStatusLabel(publication, locale),
    subtitle: publication.subtitle,
    summary: publication.summary[locale],
    title: buildPublicationTitle(publication),
  };
}
