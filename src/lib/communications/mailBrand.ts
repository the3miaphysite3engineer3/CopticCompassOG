import type { Language } from "@/types/i18n";

/**
 * Centralizes the shared mail-brand copy used across transactional and update
 * emails.
 */
export const mailBrand = {
  brandName: "Coptic Compass",
  descriptor: "Coptic Dictionary, Grammar, and Publications",
  fromDisplayName: "Coptic Compass",
  founderLine: "by Kyrillos Wannes",
  liveUrl: "https://kyrilloswannes.com",
} as const;

/**
 * Returns the localized footer copy fragments used in branded emails.
 */
function getMailFooterCopy(language: Language) {
  if (language === "nl") {
    return {
      browseLabel: "Verder lezen op Coptic Compass",
      descriptor: "Koptisch woordenboek, grammatica en publicaties.",
      signoff: "Met vriendelijke groet,",
    };
  }

  return {
    browseLabel: "Continue reading on Coptic Compass",
    descriptor: "Coptic dictionary, grammar, and publications.",
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
