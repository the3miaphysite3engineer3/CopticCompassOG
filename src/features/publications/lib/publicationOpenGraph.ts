import {
  buildOpenGraphImageUrl,
  getOpenGraphSectionFooter,
} from "@/features/seo/lib/openGraph";
import type { Language } from "@/types/i18n";
import {
  buildPublicationTitle,
  type Publication,
} from "@/features/publications/lib/publications";

export type PublicationOpenGraphPreview = {
  eyebrow: string;
  footerLabel: string;
  languageLabel: string;
  statusLabel: string;
  subtitle?: string;
  summary: string;
  title: string;
};

function getPublicationStatusLabel(publication: Publication, locale: Language) {
  if (locale === "nl") {
    return publication.status === "published" ? "Nu beschikbaar" : "Binnenkort";
  }

  return publication.status === "published" ? "Available now" : "Forthcoming";
}

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
