"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/Badge";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import { RelatedGrammarLessonsPanel } from "@/features/grammar/components/RelatedGrammarLessonsPanel";
import type { GrammarLessonReference } from "@/features/grammar/lib/grammarContentGraph";
import {
  getPublicationFormatLabel,
  getPublicationPath,
  type Publication,
} from "@/features/publications/lib/publications";
import { getLocalizedHomePath, getPublicationsPath } from "@/lib/locale";

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
  const formatLabel = getPublicationFormatLabel(publication, language);

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-stack"
      width="standard"
      accents={[
        pageShellAccents.heroGoldBand,
        pageShellAccents.topRightCopticWashInset,
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
          className={buttonClassName({
            className: "inline-flex gap-2",
            size: "md",
            variant: "secondary",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("publications.back")}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <SurfacePanel
          rounded="lg"
          shadow="soft"
          variant="elevated"
          className="relative overflow-hidden p-5"
        >
          <div className="relative aspect-[3/4.1] overflow-hidden rounded-lg border border-line/80 bg-paper">
            {publication.image ? (
              <Image
                src={publication.image}
                alt={publication.title}
                fill
                sizes="(min-width: 1024px) 352px, calc(100vw - 6rem)"
                className="object-contain object-center p-3"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-elevated">
                <div className="max-w-[14rem] text-center">
                  <Badge tone="surface" size="sm" className="mb-4">
                    {t("publications.coverPlaceholder")}
                  </Badge>
                  <p className="text-sm leading-7 text-muted">
                    {publication.summary[language]}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SurfacePanel>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                tone={publication.status === "published" ? "accent" : "neutral"}
                size="sm"
              >
                {statusLabel}
              </Badge>
              <Badge
                tone={publication.lang === "COP" ? "coptic" : "surface"}
                size="sm"
              >
                {publication.lang}
              </Badge>
              <Badge tone="surface" size="sm">
                {formatLabel}
              </Badge>
            </div>

            <PageHeader
              align="left"
              title={publication.title}
              tone="brand"
              size="compact"
            />

            {publication.subtitle ? (
              <p className="text-lg font-semibold tracking-[0.01em] text-muted">
                {publication.subtitle}
              </p>
            ) : null}

            <p className="max-w-3xl text-lg leading-8 text-muted">
              {publication.summary[language]}
            </p>
          </div>

          <SurfacePanel rounded="lg" shadow="soft" className="p-6">
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {t("publications.status")}
                </dt>
                <dd className="mt-2 text-base font-semibold text-ink">
                  {statusLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {t("publications.language")}
                </dt>
                <dd className="mt-2 text-base font-semibold text-ink">
                  {publication.lang}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {t("publications.format")}
                </dt>
                <dd className="mt-2 text-base font-semibold text-ink">
                  {formatLabel}
                </dd>
              </div>
            </dl>
          </SurfacePanel>

          {publication.link ? (
            <a
              href={publication.link}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({
                className: "inline-flex items-center gap-2 px-6",
                size: "lg",
                variant: "primary",
              })}
            >
              {t("publications.externalLink")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ) : (
            <SurfacePanel rounded="lg" variant="subtle" className="p-5">
              <p className="text-sm leading-7 text-muted">
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
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              {t("publications.related")}
            </h2>
            <p className="text-muted">{t("publications.relatedDesc")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {relatedPublications.map((relatedPublication) => (
              <Link
                key={relatedPublication.id}
                href={getPublicationPath(relatedPublication.id, language)}
                className="group"
              >
                <SurfacePanel
                  rounded="lg"
                  className="flex h-full flex-col justify-between p-5 transition-colors hover:border-accent/35"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="surface" size="xs">
                        {getPublicationFormatLabel(
                          relatedPublication,
                          language,
                        )}
                      </Badge>
                      <Badge
                        tone={
                          relatedPublication.status === "published"
                            ? "accent"
                            : "neutral"
                        }
                        size="xs"
                      >
                        {relatedPublication.status === "published"
                          ? t("publications.status.published")
                          : t("publications.status.forthcoming")}
                      </Badge>
                      <Badge
                        tone={
                          relatedPublication.lang === "COP"
                            ? "coptic"
                            : "surface"
                        }
                        size="xs"
                      >
                        {relatedPublication.lang}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-ink">
                        {relatedPublication.title}
                      </h3>
                      {relatedPublication.subtitle ? (
                        <p className="mt-1 text-sm text-muted">
                          {relatedPublication.subtitle}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-sm leading-7 text-muted">
                      {relatedPublication.summary[language]}
                    </p>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong transition-colors group-hover:text-ink dark:text-accent dark:group-hover:text-accent-strong">
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
