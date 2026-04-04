import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@/components/BreadcrumbTrail";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import type { LegalDocument } from "@/features/legal/lib/legalDocuments";

export function LegalDocumentPage({
  breadcrumbItems,
  title,
  description,
  sections,
}: LegalDocument & { breadcrumbItems?: readonly BreadcrumbTrailItem[] }) {
  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 md:p-10"
      contentClassName="w-full max-w-4xl pt-10"
    >
      <div className="mb-12 space-y-8">
        {breadcrumbItems ? <BreadcrumbTrail items={breadcrumbItems} /> : null}
        <PageHeader title={title} description={description} />
      </div>

      <SurfacePanel className="space-y-8 p-8 text-stone-800 dark:text-stone-200 md:p-12">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-xl font-semibold">{section.title}</h2>
            <p className="leading-relaxed text-stone-600 dark:text-stone-400">
              {section.body}
            </p>
          </section>
        ))}
      </SurfacePanel>
    </PageShell>
  );
}
