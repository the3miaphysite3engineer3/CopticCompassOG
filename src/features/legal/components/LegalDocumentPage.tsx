import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import type { LegalDocument } from "@/features/legal/lib/legalDocuments";

export function LegalDocumentPage({
  title,
  description,
  sections,
}: LegalDocument) {
  return (
    <PageShell className="py-24" contentClassName="mx-auto max-w-4xl px-4">
      <PageHeader title={title} description={description} className="mb-12" />

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
