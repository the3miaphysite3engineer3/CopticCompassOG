"use client";

import { AppPageIntro } from "@/components/AppPageIntro";
import { type BreadcrumbTrailItem } from "@/components/BreadcrumbTrail";
import { useLanguage } from "@/components/LanguageProvider";
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
      contentClassName="app-page-content"
      width="standard"
      accents={[
        pageShellAccents.heroGoldBand,
        pageShellAccents.topRightCopticWashInset,
      ]}
    >
      <AppPageIntro
        align="left"
        breadcrumbs={breadcrumbItems}
        title={title}
        description={description}
        tone="brand"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <SurfacePanel
          as="article"
          rounded="lg"
          variant="elevated"
          className="divide-y divide-line p-6 text-ink md:p-8"
        >
          {sections.map((section, index) => (
            <section
              id={`section-${index}`}
              key={section.title}
              className="scroll-mt-32 py-8 first:pt-0 last:pb-0"
            >
              <h2 className="mb-4 text-xl font-semibold text-ink">
                {section.title}
              </h2>
              <p className="leading-loose text-muted">{section.body}</p>
            </section>
          ))}
        </SurfacePanel>

        <aside className="hidden lg:block">
          <div className="app-sticky-panel space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t("shared.contents")}
            </h3>
            <ul className="space-y-3 text-sm font-medium text-muted">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#section-${index}`}
                    className="transition-colors hover:text-accent-strong dark:hover:text-accent"
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
