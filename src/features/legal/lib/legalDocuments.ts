import type { Language } from "@/types/i18n";

export interface LegalDocumentSection {
  title: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  description: string;
  sections: readonly LegalDocumentSection[];
}

const PRIVACY_DOCUMENTS = {
  en: {
    title: "Privacy Policy",
    description: "How we handle and protect your data.",
    sections: [
      {
        title: "1. Information We Collect",
        body: "When you sign in using Google Authentication, we collect only your basic profile information (such as your name, profile picture, and email address) explicitly granted by Google. This information is used strictly to create and manage your personal session on Coptic Compass.",
      },
      {
        title: "2. How We Use Your Information",
        body: "Your email address is used to uniquely identify your account, secure your profile, and save your progress across our digital tools (such as dictionary settings or learning progress). We do not ever sell, rent, or share your personal information with third parties or external advertisers.",
      },
      {
        title: "3. Data Security",
        body: "Your account data is managed and secured using Supabase, which implements industry-standard encryption, rate-limiting, and security protocols to protect your information and password hashes.",
      },
      {
        title: "4. Account Deletion",
        body: "You may request to have your account and all associated data permanently deleted from our servers at any time by contacting us.",
      },
      {
        title: "5. Contact Us",
        body: "If you have any questions or concerns about this Privacy Policy, please contact the developer directly.",
      },
    ],
  },
  nl: {
    title: "Privacybeleid",
    description: "Hoe we uw gegevens behandelen en beschermen.",
    sections: [
      {
        title: "1. Welke gegevens we verzamelen",
        body: "Wanneer u inlogt via Google-authenticatie, verzamelen we uitsluitend de basisprofielgegevens die u uitdrukkelijk via Google hebt gedeeld, zoals uw naam, profielfoto en e-mailadres. Deze informatie wordt alleen gebruikt om uw persoonlijke sessie op Koptisch Kompas aan te maken en te beheren.",
      },
      {
        title: "2. Hoe we uw gegevens gebruiken",
        body: "Uw e-mailadres wordt gebruikt om uw account uniek te identificeren, uw profiel te beveiligen en uw voortgang in onze digitale tools op te slaan, zoals woordenboekinstellingen of leerprogressie. Wij verkopen, verhuren of delen uw persoonsgegevens nooit met derden of externe adverteerders.",
      },
      {
        title: "3. Gegevensbeveiliging",
        body: "Uw accountgegevens worden beheerd en beveiligd via Supabase, dat gebruikmaakt van industriestandaard versleuteling, rate limiting en beveiligingsprotocollen om uw gegevens en wachtwoordhashes te beschermen.",
      },
      {
        title: "4. Verwijdering van uw account",
        body: "U kunt op elk moment verzoeken om uw account en alle bijbehorende gegevens permanent van onze servers te laten verwijderen door contact met ons op te nemen.",
      },
      {
        title: "5. Contact",
        body: "Als u vragen of zorgen heeft over dit privacybeleid, neem dan rechtstreeks contact op met de ontwikkelaar.",
      },
    ],
  },
} as const satisfies Record<Language, LegalDocument>;

const TERMS_DOCUMENTS = {
  en: {
    title: "Terms of Service",
    description: "The rules and regulations for using our digital tools.",
    sections: [
      {
        title: "1. Terms",
        body: "By accessing Coptic Compass and using the digital Coptic dictionary, you agree to be bound by these terms of service and all applicable laws and regulations, and you agree that you are responsible for compliance with any applicable local laws.",
      },
      {
        title: "2. Use License",
        body: "Permission is granted to temporarily view the materials (information, text, or software) on Coptic Compass for personal, non-commercial transitory viewing and learning only. This is the grant of a license, not a transfer of title or intellectual property.",
      },
      {
        title: "3. Disclaimer",
        body: "The materials on Coptic Compass are provided on an 'as is' basis. The developer makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
      },
      {
        title: "4. Limitations",
        body: "In no event shall Coptic Compass be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the site, even if notified orally or in writing of the possibility of such damage.",
      },
      {
        title: "5. Revisions",
        body: "The materials appearing on Coptic Compass could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the website are strictly accurate, complete or current. We may make changes to the materials contained on the web site at any time without notice.",
      },
    ],
  },
  nl: {
    title: "Gebruiksvoorwaarden",
    description:
      "De regels en voorwaarden voor het gebruik van onze digitale tools.",
    sections: [
      {
        title: "1. Voorwaarden",
        body: "Door Koptisch Kompas te bezoeken en het digitale Koptische woordenboek te gebruiken, gaat u akkoord met deze gebruiksvoorwaarden en alle toepasselijke wet- en regelgeving. U erkent ook zelf verantwoordelijk te zijn voor naleving van eventueel geldende lokale wetten.",
      },
      {
        title: "2. Gebruikslicentie",
        body: "Er wordt toestemming verleend om de materialen (informatie, tekst of software) op Koptisch Kompas tijdelijk te bekijken voor uitsluitend persoonlijk, niet-commercieel en tijdelijk gebruik in het kader van studie en raadpleging. Dit is een licentie en geen overdracht van eigendom of intellectuele rechten.",
      },
      {
        title: "3. Disclaimer",
        body: "De materialen op Koptisch Kompas worden aangeboden op een 'as is'-basis. De ontwikkelaar geeft geen enkele uitdrukkelijke of impliciete garantie en wijst, voor zover wettelijk toegestaan, alle overige garanties af, waaronder impliciete garanties van verhandelbaarheid, geschiktheid voor een bepaald doel of niet-inbreuk op intellectuele eigendom of andere rechten.",
      },
      {
        title: "4. Beperkingen van aansprakelijkheid",
        body: "In geen geval kan Koptisch Kompas aansprakelijk worden gesteld voor enige schade, waaronder maar niet beperkt tot verlies van gegevens, winstderving of bedrijfsonderbreking, die voortvloeit uit het gebruik van of het onvermogen om de materialen op de site te gebruiken, zelfs wanneer op voorhand mondeling of schriftelijk op die mogelijkheid is gewezen.",
      },
      {
        title: "5. Herzieningen",
        body: "De materialen op Koptisch Kompas kunnen technische, typografische of fotografische fouten bevatten. Wij garanderen niet dat de materialen op de website volledig accuraat, volledig of actueel zijn. Wij kunnen de inhoud van de website op elk moment zonder voorafgaande kennisgeving wijzigen.",
      },
    ],
  },
} as const satisfies Record<Language, LegalDocument>;

/**
 * Returns the localized privacy-policy copy rendered on the legal page.
 */
export function getPrivacyDocument(locale: Language): LegalDocument {
  return PRIVACY_DOCUMENTS[locale];
}

/**
 * Returns the localized terms-of-service copy rendered on the legal page.
 */
export function getTermsDocument(locale: Language): LegalDocument {
  return TERMS_DOCUMENTS[locale];
}
