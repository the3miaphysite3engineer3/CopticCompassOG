import type { Language } from "@/types/i18n";

export const mailBrand = {
  brandName: "Coptic Compass",
  descriptor: "Coptic Dictionary, Grammar, and Publications",
  fromDisplayName: "Coptic Compass",
  founderLine: "by Kyrillos Wannes",
  liveUrl: "https://kyrilloswannes.com",
} as const;

export function getMailFooterCopy(language: Language) {
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

export function getMailFooterLines(language: Language) {
  const footer = getMailFooterCopy(language);

  return [
    footer.signoff,
    mailBrand.brandName,
    footer.descriptor,
    `${footer.browseLabel}: ${mailBrand.liveUrl}`,
  ];
}
