import Link from "next/link";

import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import StructuredData from "@/components/StructuredData";
import { SurfacePanel } from "@/components/SurfacePanel";
import { getTranslation } from "@/lib/i18n";
import {
  getContactPath,
  getContributorsPath,
  getLocalizedHomePath,
} from "@/lib/locale";
import { createLocalizedPageMetadata } from "@/lib/metadata";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
import { createBreadcrumbStructuredData } from "@/lib/structuredData";

import type { Metadata } from "next";

type ContributorContact = {
  href: string;
  label: string;
  external?: boolean;
};

type ContributorCard = {
  description: string;
  name: string;
  role: string;
  contacts: readonly ContributorContact[];
};

const contributorsCopy = {
  en: {
    seoTitle: "Contributors",
    description:
      "Meet the contributors behind Coptic Compass, including George Joseph Basilious Tawadrous and Kyrillos Wannes.",
    title: "Contributors",
    subtitle:
      "Coptic Compass is shaped by contributors focused on Coptic language learning, AI-assisted workflows, and high-quality educational tooling.",
    sectionTitle: "Core contributors",
    breadcrumbLabel: "Contributors",
    contactsHeading: "Contact links",
    contributors: [
      {
        name: "George Joseph Basilious Tawadrous",
        role: "AI Engineer and Developer",
        description:
          "Supports the project with engineering collaboration and practical product feedback for Coptic learning workflows.",
        contacts: [
          {
            href: "mailto:georgtawadrous@gmail.com",
            label: "georgtawadrous@gmail.com",
          },
          {
            href: "https://www.linkedin.com/in/the3miaphysite3engineer3/",
            label: "LinkedIn",
            external: true,
          },
          {
            href: "https://github.com/the3miaphysite3engineer3",
            label: "GitHub",
            external: true,
          },
          {
            href: "https://georgetawadrousportfolio.web.app",
            label: "Portfolio",
            external: true,
          },
        ],
      },
      {
        name: "Kyrillos Wannes",
        role: "Developer and Coptologist",
        description:
          "Builds and maintains Coptic Compass, including the dictionary, grammar platform, and Shenute AI integrations.",
        contacts: [
          {
            href: "https://www.copticcompass.com",
            label: "Website",
            external: true,
          },
          {
            href: "https://github.com/KyroHub",
            label: "GitHub",
            external: true,
          },
          {
            href: "/contact",
            label: "Contact page",
          },
        ],
      },
    ] satisfies readonly ContributorCard[],
    researchCredits: {
      title: "Research & NMT Credits",
      description:
        "Our Neural Machine Translation (NMT) for Coptic is made possible by the pioneering research and tools from the CopticTranslator project.",
      items: [
        {
          label: "CopticTranslator.com",
          href: "https://www.coptictranslator.com/",
          description:
            "Primary platform for Coptic-English translation services.",
        },
        {
          label: "NMT Paper (PDF)",
          href: "https://www.coptictranslator.com/paper.pdf",
          description:
            "Technical details of the underlying seq2seq architecture.",
        },
        {
          label: "arXiv:2404.13813",
          href: "https://arxiv.org/abs/2404.13813",
          description:
            "Peer-reviewed research on Coptic NMT datasets and models.",
        },
      ],
    },
  },
  nl: {
    seoTitle: "Bijdragers",
    description:
      "Maak kennis met de bijdragers achter Coptic Compass, onder wie George Joseph Basilious Tawadrous en Kyrillos Wannes.",
    title: "Bijdragers",
    subtitle:
      "Coptic Compass wordt gevormd door bijdragers die zich richten op Koptisch taalonderwijs, AI-ondersteunde workflows en educatieve tools van hoge kwaliteit.",
    sectionTitle: "Kernbijdragers",
    breadcrumbLabel: "Bijdragers",
    contactsHeading: "Contactlinks",
    contributors: [
      {
        name: "George Joseph Basilious Tawadrous",
        role: "AI-engineer en ontwikkelaar",
        description:
          "Ondersteunt het project met technische samenwerking en praktische productfeedback voor Koptische leerworkflows.",
        contacts: [
          {
            href: "mailto:georgtawadrous@gmail.com",
            label: "georgtawadrous@gmail.com",
          },
          {
            href: "https://www.linkedin.com/in/the3miaphysite3engineer3/",
            label: "LinkedIn",
            external: true,
          },
          {
            href: "https://github.com/the3miaphysite3engineer3",
            label: "GitHub",
            external: true,
          },
          {
            href: "https://georgetawadrousportfolio.web.app",
            label: "Portfolio",
            external: true,
          },
        ],
      },
      {
        name: "Kyrillos Wannes",
        role: "Ontwikkelaar en koptoloog",
        description:
          "Bouwt en onderhoudt Coptic Compass, inclusief het woordenboek, het grammaticaplatform en Shenute AI-integraties.",
        contacts: [
          {
            href: "https://www.copticcompass.com",
            label: "Website",
            external: true,
          },
          {
            href: "https://github.com/KyroHub",
            label: "GitHub",
            external: true,
          },
          {
            href: "/contact",
            label: "Contactpagina",
          },
        ],
      },
    ] satisfies readonly ContributorCard[],
    researchCredits: {
      title: "Onderzoek & NMT Credits",
      description:
        "Onze Neural Machine Translation (NMT) voor het Koptisch is mogelijk gemaakt door de baanbrekende onderzoeken en tools van het CopticTranslator-project.",
      items: [
        {
          label: "CopticTranslator.com",
          href: "https://www.coptictranslator.com/",
          description:
            "Primair platform voor Koptisch-Engelse vertaaldiensten.",
        },
        {
          label: "NMT Paper (PDF)",
          href: "https://www.coptictranslator.com/paper.pdf",
          description:
            "Technische details van de onderliggende seq2seq-architectuur.",
        },
        {
          label: "arXiv:2404.13813",
          href: "https://arxiv.org/abs/2404.13813",
          description:
            "Peer-reviewed onderzoek naar Koptische NMT-datasets en -modellen.",
        },
      ],
    },
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);
  const copy = contributorsCopy[resolvedLocale];

  return createLocalizedPageMetadata({
    title: copy.seoTitle,
    description: copy.description,
    path: "/contributors",
    locale: resolvedLocale,
  });
}

/**
 * Renders the localized contributors page with project collaborators and links.
 */
export default async function ContributorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);
  const copy = contributorsCopy[resolvedLocale];
  const contactLinkClassName =
    "underline decoration-sky-400 underline-offset-4 hover:text-sky-700 dark:hover:text-sky-300";

  const renderContributorContact = (contact: ContributorContact) => {
    if (contact.external) {
      return (
        <a
          href={contact.href}
          target="_blank"
          rel="noreferrer"
          className={contactLinkClassName}
        >
          {contact.label}
        </a>
      );
    }

    if (contact.href.startsWith("/")) {
      return (
        <Link
          href={getContactPath(resolvedLocale)}
          className={contactLinkClassName}
        >
          {contact.label}
        </Link>
      );
    }

    return (
      <a href={contact.href} className={contactLinkClassName}>
        {contact.label}
      </a>
    );
  };

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 md:p-10"
      contentClassName="w-full space-y-8 pt-10"
      width="standard"
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrbSoft,
      ]}
    >
      <StructuredData
        data={createBreadcrumbStructuredData([
          {
            name: getTranslation(resolvedLocale, "nav.home"),
            path: getLocalizedHomePath(resolvedLocale),
          },
          {
            name: copy.breadcrumbLabel,
            path: getContributorsPath(resolvedLocale),
          },
        ])}
      />

      <BreadcrumbTrail
        items={[
          {
            label: getTranslation(resolvedLocale, "nav.home"),
            href: getLocalizedHomePath(resolvedLocale),
          },
          { label: copy.breadcrumbLabel },
        ]}
      />

      <PageHeader
        title={copy.title}
        description={copy.subtitle}
        tone="sky"
        size="compact"
      />

      <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {copy.sectionTitle}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {copy.contributors.map((contributor) => (
            <article
              key={contributor.name}
              className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-5 dark:border-stone-800/80 dark:bg-stone-950/50"
            >
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {contributor.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-sky-700 dark:text-sky-300">
                {contributor.role}
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
                {contributor.description}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                {copy.contactsHeading}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-stone-700 dark:text-stone-200">
                {contributor.contacts.map((contact) => (
                  <li key={`${contributor.name}-${contact.href}`}>
                    {renderContributorContact(contact)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SurfacePanel>
      <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {copy.researchCredits.title}
        </p>
        <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300 max-w-2xl">
          {copy.researchCredits.description}
        </p>

        <div className="mt-6 space-y-4">
          {copy.researchCredits.items.map((item) => (
            <div key={item.href} className="group flex flex-col space-y-1">
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 transition-colors"
              >
                {item.label} →
              </a>
              <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </SurfacePanel>
    </PageShell>
  );
}
