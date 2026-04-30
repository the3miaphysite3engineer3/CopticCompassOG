"use client";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@/components/BreadcrumbTrail";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import type { LegalDocument } from "@/features/legal/lib/legalDocuments";

export function LegalDocumentPageClient({
  breadcrumbItems,
  document,
}: {
  breadcrumbItems: readonly BreadcrumbTrailItem[];
  document: LegalDocument;
}) {
  const { title, description, sections } = document;
  const { t } = useLanguage();

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-stack"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      {breadcrumbItems ? <BreadcrumbTrail items={breadcrumbItems} /> : null}

      <PageHeader
        title={title}
        description={description}
        align="left"
        size="workspace"
        tone="sky"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <SurfacePanel
          as="article"
          rounded="3xl"
          variant="elevated"
          className="divide-y divide-stone-200/80 p-6 text-stone-800 dark:divide-stone-800/80 dark:text-stone-200 md:p-8"
        >
          {sections.map((section, index) => (
            <section
              id={`section-${index}`}
              key={section.title}
              className="scroll-mt-32 py-8 first:pt-0 last:pb-0"
            >
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
                {section.title}
              </h2>
              <p className="leading-loose text-stone-600 dark:text-stone-400">
                {section.body}
              </p>
            </section>
          ))}
        </SurfacePanel>

        <aside className="hidden lg:block">
          <div className="app-sticky-panel space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {t("shared.contents")}
            </h3>
            <ul className="space-y-3 text-sm font-medium text-stone-600 dark:text-stone-400">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#section-${index}`}
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
