import ContactPageClient from "@/features/contact/components/ContactPageClient";
import { createLocalizedPageMetadata } from "@/lib/metadata";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

function buildContactDescription(locale: "en" | "nl") {
  return locale === "nl"
    ? "Neem contact op met Coptic Compass voor woordenboekfeedback, grammaticavragen, onderzoekssamenwerking, publicatievragen of platformondersteuning."
    : "Contact Coptic Compass for dictionary feedback, grammar questions, research collaboration, publication inquiries, or platform support.";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);

  return createLocalizedPageMetadata({
    title: resolvedLocale === "nl" ? "Contact" : "Contact",
    description: buildContactDescription(resolvedLocale),
    path: "/contact",
    locale: resolvedLocale,
  });
}

/**
 * Renders the localized public contact page.
 */
export default function ContactPage() {
  return <ContactPageClient />;
}
