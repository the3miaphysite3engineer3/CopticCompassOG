import type { Language } from "@/types/i18n";

/**
 * Centralizes the shared mail-brand copy used across transactional and update
 * emails.
 */
export const mailBrand = {
  brandName: "Coptic Compass",
  descriptor: "Digital Coptology Platform",
  fromDisplayName: "Coptic Compass",
  founderLine: "by Kyrillos Wannes",
  liveUrl: "https://www.copticcompass.com",
} as const;

export const mailBrandColors = {
  coptic: "#008329",
  copticSoft: "#ecfaf0",
  elevated: "#f6f4ef",
  gold: "#ebc17d",
  goldSoft: "#fcf6eb",
  goldStrong: "#895918",
  ink: "#1e1d1d",
  line: "#e2ddd3",
  muted: "#5e584f",
  paper: "#f9f8f5",
  surface: "#ffffff",
} as const;

/**
 * Returns the localized footer copy fragments used in branded emails.
 */
function getMailFooterCopy(language: Language) {
  if (language === "nl") {
    return {
      browseLabel: "Verder lezen op Coptic Compass",
      descriptor: "Een betrouwbaar digitaal Koptologieplatform.",
      signoff: "Met vriendelijke groet,",
    };
  }

  return {
    browseLabel: "Continue reading on Coptic Compass",
    descriptor: "A trusted digital Coptology platform.",
    signoff: "Kind regards,",
  };
}

/**
 * Builds the localized footer lines rendered in plain-text and HTML mail
 * templates.
 */
export function getMailFooterLines(language: Language) {
  const footer = getMailFooterCopy(language);

  return [
    footer.signoff,
    mailBrand.brandName,
    footer.descriptor,
    `${footer.browseLabel}: ${mailBrand.liveUrl}`,
  ];
}
