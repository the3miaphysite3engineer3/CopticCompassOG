"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/Badge";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import { RelatedGrammarLessonsPanel } from "@/features/grammar/components/RelatedGrammarLessonsPanel";
import type { GrammarLessonReference } from "@/features/grammar/lib/grammarContentGraph";
import {
  getPublicationPath,
  type Publication,
} from "@/features/publications/lib/publications";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedHomePath, getPublicationsPath } from "@/lib/locale";

const LANGUAGE_BADGE_CLASS_NAMES: Record<Publication["lang"], string> = {
  COP: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  NL: "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  EN: "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-400",
};

function getFormatLabel(
  publication: Publication,
  language: ReturnType<typeof useLanguage>["language"],
) {
  if (publication.schemaType === "Book") {
    return language === "nl" ? "Boek" : "Book";
  }

  if (publication.schemaType === "ScholarlyArticle") {
    return language === "nl" ? "Onderzoeksartikel" : "Research Article";
  }

  return language === "nl" ? "Creatief werk" : "Creative Work";
}

type PublicationDetailPageClientProps = {
  grammarLessons: readonly GrammarLessonReference[];
  publication: Publication;
  relatedPublications: readonly Publication[];
};

export default function PublicationDetailPageClient({
  grammarLessons,
  publication,
  relatedPublications,
}: PublicationDetailPageClientProps) {
  const { language, t } = useLanguage();
  const statusLabel =
    publication.status === "published"
      ? t("publications.status.published")
      : t("publications.status.forthcoming");

  return (
    <PageShell
      className="min-h-screen px-6 py-16 md:px-10"
      contentClassName="mx-auto max-w-6xl space-y-10"
      accents={[
        pageShellAccents.topRightEmeraldOrb,
        pageShellAccents.topLeftSkyOrbInset,
      ]}
    >
      <div className="space-y-4">
        <BreadcrumbTrail
          items={[
            { label: t("nav.home"), href: getLocalizedHomePath(language) },
            {
              label: t("nav.publications"),
              href: getPublicationsPath(language),
            },
            { label: publication.title },
          ]}
        />

        <Link
          href={getPublicationsPath(language)}
          className="btn-secondary inline-flex gap-2 px-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("publications.back")}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <SurfacePanel rounded="3xl" className="relative overflow-hidden p-5">
          <div className="relative aspect-[3/4.1] overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900">
            {publication.image ? (
              <Image
                src={publication.image}
                alt={publication.title}
                fill
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900">
                <div className="max-w-[14rem] text-center">
                  <Badge tone="surface" size="sm" className="mb-4">
                    {t("publications.coverPlaceholder")}
                  </Badge>
                  <p className="text-sm leading-7 text-stone-500 dark:text-stone-400">
                    {publication.summary[language]}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SurfacePanel>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent" size="xs" caps>
              {t("publications.badge")}
            </Badge>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-widest ${LANGUAGE_BADGE_CLASS_NAMES[publication.lang]}`}
            >
              {publication.lang}
            </span>
            <Badge tone="surface" size="xs">
              {getFormatLabel(publication, language)}
            </Badge>
            <Badge
              tone={publication.status === "published" ? "coptic" : "neutral"}
              size="xs"
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="space-y-4">
            <PageHeader
              eyebrow={t("nav.publications")}
              align="left"
              title={publication.title}
              tone="brand"
              size="compact"
            />

            {publication.subtitle ? (
              <p className="text-lg font-semibold tracking-[0.01em] text-stone-500 dark:text-stone-300">
                {publication.subtitle}
              </p>
            ) : null}

            <p className="max-w-3xl text-lg leading-8 text-stone-600 dark:text-stone-300">
              {publication.summary[language]}
            </p>
          </div>

          <SurfacePanel rounded="3xl" className="p-6">
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  {t("publications.status")}
                </dt>
                <dd className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-200">
                  {statusLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  {t("publications.language")}
                </dt>
                <dd className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-200">
                  {publication.lang}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  {t("publications.format")}
                </dt>
                <dd className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-200">
                  {getFormatLabel(publication, language)}
                </dd>
              </div>
            </dl>
          </SurfacePanel>

          {publication.link ? (
            <a
              href={publication.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 px-6"
            >
              {t("publications.externalLink")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ) : (
            <SurfacePanel rounded="3xl" variant="subtle" className="p-5">
              <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
                {t("publications.noExternalLink")}
              </p>
            </SurfacePanel>
          )}
        </div>
      </div>

      <RelatedGrammarLessonsPanel
        description={
          language === "nl"
            ? "Deze publicatie wordt rechtstreeks geciteerd of gebruikt in de volgende grammaticahandleidingen."
            : "This publication is cited or used directly in the following grammar lessons."
        }
        language={language}
        lessons={grammarLessons}
        title={
          language === "nl"
            ? "Vermeld in grammaticahandleidingen"
            : "Referenced in grammar lessons"
        }
      />

      {relatedPublications.length > 0 ? (
        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
              {t("publications.related")}
            </h2>
            <p className="text-stone-500 dark:text-stone-400">
              {t("publications.relatedDesc")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {relatedPublications.map((relatedPublication) => (
              <Link
                key={relatedPublication.id}
                href={getPublicationPath(relatedPublication.id, language)}
                className="group"
              >
                <SurfacePanel
                  rounded="3xl"
                  className="flex h-full flex-col justify-between p-5 transition-colors hover:border-sky-300 dark:hover:border-sky-700"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="surface" size="xs">
                        {getFormatLabel(relatedPublication, language)}
                      </Badge>
                      <Badge
                        tone={
                          relatedPublication.status === "published"
                            ? "coptic"
                            : "neutral"
                        }
                        size="xs"
                      >
                        {relatedPublication.status === "published"
                          ? t("publications.status.published")
                          : t("publications.status.forthcoming")}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                        {relatedPublication.title}
                      </h3>
                      {relatedPublication.subtitle ? (
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                          {relatedPublication.subtitle}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
                      {relatedPublication.summary[language]}
                    </p>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition-colors group-hover:text-sky-500 dark:text-sky-400 dark:group-hover:text-sky-300">
                    {t("publications.viewDetails")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </SurfacePanel>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
