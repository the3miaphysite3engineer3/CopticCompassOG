"use client";

import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/Badge";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel, surfacePanelClassName } from "@/components/SurfacePanel";
import {
  getPublicationPath,
  publications,
} from "@/features/publications/lib/publications";
import type {
  LanguageBadge,
  Publication,
  PublicationStatus,
} from "@/features/publications/lib/publications";
import { getLocalizedHomePath } from "@/lib/locale";

type PublicationLanguageFilter = "ALL" | LanguageBadge;
type PublicationStatusFilter = "ALL" | PublicationStatus;

const languageFilterOptions: PublicationLanguageFilter[] = [
  "ALL",
  "COP",
  "NL",
  "EN",
];
const statusFilterOptions: PublicationStatusFilter[] = [
  "ALL",
  "published",
  "forthcoming",
];

function TileInner({
  pub,
  comingSoonLabel,
  priority = false,
  viewDetailsLabel,
}: {
  pub: Publication;
  comingSoonLabel: string;
  priority?: boolean;
  viewDetailsLabel: string;
}) {
  return (
    <>
      {pub.status === "published" && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="relative w-full aspect-[3/4.2] rounded-xl overflow-hidden mb-5 shadow-sm border border-stone-100 dark:border-stone-800 bg-stone-100 dark:bg-stone-900">
        {pub.image ? (
          <Image
            src={pub.image}
            alt={pub.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 268px, (min-width: 640px) calc((100vw - 6rem) / 2), calc(100vw - 3rem)"
            className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900">
            <div className="w-full h-full absolute inset-0 opacity-20 flex flex-col justify-center gap-2 px-6">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full bg-stone-500 blur-sm"
                  style={{ width: `${60 + Math.sin(i) * 30}%` }}
                />
              ))}
            </div>
            <div className="relative z-10 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700">
              <span className="text-stone-700 dark:text-stone-300 font-bold text-sm tracking-widest uppercase">
                {comingSoonLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 justify-end">
        <h2 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1 z-10 leading-snug line-clamp-3">
          {pub.title}
        </h2>
        {pub.subtitle && (
          <p className="text-stone-500 dark:text-stone-400 text-xs z-10 mb-2 leading-snug">
            {pub.subtitle}
          </p>
        )}
        {pub.link && pub.status === "published" ? (
          <p className="text-stone-500 dark:text-stone-400 text-sm z-10 flex items-center font-medium mt-1">
            Available on Amazon
            <ArrowUpRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300" />
          </p>
        ) : null}
        <p className="text-sky-600 dark:text-sky-400 text-sm z-10 flex items-center font-semibold mt-4">
          {viewDetailsLabel}
          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </p>
      </div>
    </>
  );
}

function PublicationTile({
  pub,
  comingSoonLabel,
  priority = false,
  viewDetailsLabel,
}: {
  pub: Publication;
  comingSoonLabel: string;
  priority?: boolean;
  viewDetailsLabel: string;
}) {
  const { language } = useLanguage();
  const baseClass = surfacePanelClassName({
    rounded: "3xl",
    interactive: true,
    className:
      "group relative flex flex-col justify-between overflow-hidden p-5 md:p-6",
  });

  return (
    <Link
      href={getPublicationPath(pub.id, language)}
      id={pub.id}
      className={`${baseClass} app-anchor-section hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-500/10 cursor-pointer transform hover:-translate-y-1`}
    >
      <TileInner
        pub={pub}
        comingSoonLabel={comingSoonLabel}
        priority={priority}
        viewDetailsLabel={viewDetailsLabel}
      />
    </Link>
  );
}

export default function PublicationsPageClient() {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<PublicationLanguageFilter>("ALL");
  const [selectedStatus, setSelectedStatus] =
    useState<PublicationStatusFilter>("ALL");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    selectedLanguage !== "ALL" ||
    selectedStatus !== "ALL";
  const filteredPublications = useMemo(
    () =>
      publications.filter((publication) => {
        if (
          selectedLanguage !== "ALL" &&
          publication.lang !== selectedLanguage
        ) {
          return false;
        }

        if (selectedStatus !== "ALL" && publication.status !== selectedStatus) {
          return false;
        }

        if (normalizedQuery.length === 0) {
          return true;
        }

        const searchableText = [
          publication.title,
          publication.subtitle,
          publication.lang,
          publication.status,
          publication.schemaType,
          publication.summary[language],
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        return searchableText.includes(normalizedQuery);
      }),
    [language, normalizedQuery, selectedLanguage, selectedStatus],
  );

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-stack"
      width="standard"
      accents={[
        pageShellAccents.topRightEmeraldOrb,
        pageShellAccents.topLeftSkyOrbInset,
      ]}
    >
      <BreadcrumbTrail
        items={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.publications") },
        ]}
      />

      <PageHeader
        title={t("nav.publications")}
        description={t("home.publications.desc")}
      />

      <SurfacePanel
        rounded="3xl"
        shadow="soft"
        variant="subtle"
        className="space-y-4 p-4 md:p-5"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {t("publications.filters")}
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("publications.searchPlaceholder")}
                className="input-base h-11 rounded-xl pl-10 text-sm"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {t("publications.status")}
            </span>
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as PublicationStatusFilter)
              }
              className="compact-select-base min-w-44"
            >
              {statusFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL"
                    ? t("publications.status.all")
                    : t(`publications.status.${status}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {t("publications.language")}
            </span>
            <select
              value={selectedLanguage}
              onChange={(event) =>
                setSelectedLanguage(
                  event.target.value as PublicationLanguageFilter,
                )
              }
              className="compact-select-base min-w-40"
            >
              {languageFilterOptions.map((languageOption) => (
                <option key={languageOption} value={languageOption}>
                  {languageOption === "ALL"
                    ? t("publications.language.all")
                    : languageOption}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 pt-4 dark:border-stone-800">
          <Badge tone="surface" size="sm">
            {filteredPublications.length}{" "}
            {t(
              filteredPublications.length === 1
                ? "publications.item"
                : "publications.items",
            )}
          </Badge>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedLanguage("ALL");
                setSelectedStatus("ALL");
              }}
              className="btn-ghost h-9 px-3 text-xs uppercase tracking-widest"
            >
              {t("publications.clearFilters")}
            </button>
          ) : null}
        </div>
      </SurfacePanel>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        {filteredPublications.map((pub, i) => (
          <PublicationTile
            key={pub.id}
            pub={pub}
            comingSoonLabel={t("home.comingSoon")}
            priority={i === 0}
            viewDetailsLabel={t("publications.viewDetails")}
          />
        ))}
      </div>

      {filteredPublications.length === 0 ? (
        <EmptyState
          title={t("publications.noResults")}
          description={t("publications.noResultsDesc")}
        />
      ) : null}
    </PageShell>
  );
}
