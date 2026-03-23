import type { Metadata } from "next";
import Link from "next/link";
import "swagger-ui-dist/swagger-ui.css";
import "./swagger-overrides.css";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SwaggerDocsClient } from "@/features/grammar/components/SwaggerDocsClient";
import { getDevelopersPath, getGrammarPath } from "@/lib/locale";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Grammar API Docs",
  description:
    "Swagger-powered API documentation for the public Coptic grammar dataset, including versioned lesson, concept, example, source, and footnote endpoints.",
  path: "/api-docs",
});

const docsHighlights = [
  "Read-only and versioned responses",
  "Swagger UI plus raw OpenAPI JSON",
  "Lesson filters accept slug or canonical id",
  "Rights metadata included in the dataset",
];

export default function ApiDocsPage() {
  return (
    <PageShell
      className="min-h-screen px-6 py-14 md:px-10"
      contentClassName="mx-auto max-w-6xl space-y-10"
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrbSoft,
      ]}
    >
      <PageHeader
        eyebrow="Developer Docs"
        eyebrowVariant="badge"
        title="Grammar API Docs"
        description="Explore the public grammar dataset through a Swagger UI backed by an OpenAPI document generated from the current API surface."
        tone="sky"
        size="compact"
      />

      <section className="section-card space-y-5">
        <div className="flex flex-wrap gap-3">
          <Link href={getDevelopersPath("en")} className="btn-secondary">
            Developer Guide
          </Link>
          <Link href="/api/openapi.json" className="btn-secondary">
            OpenAPI JSON
          </Link>
          <Link href="/api/v1/grammar" className="btn-secondary">
            API Index
          </Link>
          <Link href={getGrammarPath("en")} className="btn-secondary">
            Grammar Hub
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {docsHighlights.map((highlight) => (
            <div key={highlight} className="badge-accent justify-center px-4 py-3 text-center text-sm">
              {highlight}
            </div>
          ))}
        </div>

        <p className="text-sm leading-7 text-muted">
          Public consumers should usually start with <code>/api/v1/grammar</code> for discovery or{" "}
          <code>/api/openapi.json</code> for tooling. The public dataset only exposes published
          lessons and their related records.
        </p>
      </section>

      <section className="section-card overflow-hidden">
        <SwaggerDocsClient specUrl="/api/openapi.json" />
      </section>
    </PageShell>
  );
}
