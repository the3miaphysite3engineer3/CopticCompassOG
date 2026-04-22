"use client";

import {
  BookOpenText,
  Compass,
  Home,
  type LucideIcon,
  MessageCircleQuestion,
  Search,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { buttonClassName } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { cx } from "@/lib/classes";
import { getTranslation, type TranslationKey } from "@/lib/i18n";
import {
  getDictionaryPath,
  getGrammarPath,
  getLocalizedHomePath,
  getPublicLocaleFromPathname,
  getPublicationsPath,
  getShenutePath,
} from "@/lib/locale";

import { useLanguage } from "./LanguageProvider";

type NotFoundDestination = {
  descriptionKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  labelKey: TranslationKey;
};

export function NotFoundPage() {
  const pathname = usePathname() ?? "";
  const { language } = useLanguage();
  const routeLanguage = getPublicLocaleFromPathname(pathname);
  const displayLanguage = routeLanguage ?? language;
  const t = (key: TranslationKey) => getTranslation(displayLanguage, key);

  useEffect(() => {
    const handleDocumentNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!(event.target instanceof Element)) {
        return;
      }

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#")) {
        return;
      }

      const url = new URL(anchor.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      window.location.assign(url.href);
    };

    document.addEventListener("click", handleDocumentNavigation, true);

    return () => {
      document.removeEventListener("click", handleDocumentNavigation, true);
    };
  }, []);

  const destinations: readonly NotFoundDestination[] = [
    {
      href: getLocalizedHomePath(displayLanguage),
      icon: Home,
      labelKey: "nav.home",
      descriptionKey: "notFound.homeDescription",
    },
    {
      href: getDictionaryPath(displayLanguage),
      icon: Search,
      labelKey: "nav.dictionary",
      descriptionKey: "notFound.dictionaryDescription",
    },
    {
      href: getGrammarPath(displayLanguage),
      icon: BookOpenText,
      labelKey: "nav.grammar",
      descriptionKey: "notFound.grammarDescription",
    },
    {
      href: getPublicationsPath(displayLanguage),
      icon: ScrollText,
      labelKey: "nav.publications",
      descriptionKey: "notFound.publicationsDescription",
    },
    {
      href: getShenutePath(),
      icon: MessageCircleQuestion,
      labelKey: "nav.shenute",
      descriptionKey: "notFound.shenuteDescription",
    },
  ];

  return (
    <PageShell
      className="min-h-[calc(100vh-10rem)] px-6 py-16 md:px-10"
      contentClassName="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center"
      accents={[pageShellAccents.heroSkyArc]}
    >
      <section className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-sky-200 bg-sky-50/80 text-sky-700 shadow-sm backdrop-blur-md dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-6xl font-extrabold leading-none text-stone-200 dark:text-stone-800 md:text-7xl">
            404
          </p>
        </div>

        <PageHeader
          title={t("notFound.title")}
          description={t("notFound.description")}
          align="left"
          size="compact"
          tone="brand"
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href={getLocalizedHomePath(displayLanguage)}
            className={buttonClassName({ size: "lg" })}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {t("notFound.primaryAction")}
          </Link>
          <Link
            href={getDictionaryPath(displayLanguage)}
            className={buttonClassName({ size: "lg", variant: "secondary" })}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {t("notFound.secondaryAction")}
          </Link>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="not-found-routes">
        <h2
          id="not-found-routes"
          className="text-sm font-semibold uppercase text-stone-500 dark:text-stone-400"
        >
          {t("notFound.helpTitle")}
        </h2>

        <div className="grid gap-3">
          {destinations.map((destination) => {
            const Icon = destination.icon;

            return (
              <Link
                key={destination.href}
                href={destination.href}
                className="group flex min-h-24 items-start gap-4 rounded-lg border border-stone-200 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:border-stone-800 dark:bg-stone-900/50 dark:hover:bg-stone-800/70"
              >
                <span
                  className={cx(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors",
                    "border-sky-100 bg-sky-50 text-sky-700 group-hover:border-sky-200 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-semibold text-stone-800 dark:text-stone-100">
                    {t(destination.labelKey)}
                  </span>
                  <span className="block text-sm leading-6 text-stone-500 dark:text-stone-400">
                    {t(destination.descriptionKey)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
