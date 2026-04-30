import Link from "next/link";

import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SwaggerDocsClient } from "@/features/grammar/components/SwaggerDocsClient";
import { getTranslation, type Language } from "@/lib/i18n";
import {
  getDevelopersPath,
  getGrammarPath,
  getLocalizedHomePath,
} from "@/lib/locale";
import { createPageMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

import type { Metadata } from "next";

const API_DOCS_COPY = {
  en: {
    apiIndexLabel: "API Index",
    breadcrumbLabel: "API Docs",
    developerGuideLabel: "Developer Guide",
    description:
      "Explore the public grammar dataset in Swagger and integrate Shenute AI with provider selection and OCR-backed image context.",
    grammarHubLabel: "Grammar Hub",
    highlights: [
      "Read-only and versioned responses",
      "Swagger UI plus raw OpenAPI JSON",
      "Lesson filters accept slug or canonical id",
      "Rights metadata included in the dataset",
      "Shenute AI endpoint available at /api/shenute",
      "OCR proxy endpoint available at /api/ocr",
      "Image and camera prompts support OCR-backed context",
    ],
    metadataDescription:
      "Swagger-powered API documentation for the public Coptic Compass grammar dataset plus Shenute AI and OCR-assisted integration guidance.",
    metadataTitle: "Coptic Compass Grammar + Shenute AI API Docs",
    ocrDescriptionAfterLang: "(or another language) and set",
    ocrDescriptionEnd:
      "when your backend expects a specific upload field name.",
    ocrDescriptionForward:
      "with multipart form data. Coptic Compass forwards the file to",
    ocrDescriptionReturn:
      "then returns the upstream OCR response body and content-type to the client. You can pass",
    ocrProxyLabel: "OCR Proxy",
    ocrTitle: "OCR Proxy API",
    openApiLabel: "OpenAPI JSON",
    overviewDataset:
      "for tooling. The public dataset only exposes published lessons and their related records. Shenute AI is available through",
    overviewEnd:
      "as the default provider when no explicit provider is supplied. OCR requests can be proxied through",
    overviewInstead: "instead of calling the upstream OCR service directly.",
    overviewOpenApi: "for discovery or",
    overviewProvider: "with",
    overviewStart: "Public consumers should usually start with",
    shenuteDescriptionFallback:
      "When Hugging Face is rate-limited, the API can fall back to configured alternatives.",
    shenuteDescriptionJoin: "and",
    shenuteDescriptionProviders: "Supported providers are",
    shenuteDescriptionStart: "Use",
    shenuteDescriptionWith: "with a UI-message payload.",
    shenuteEndpointLabel: "Shenute Endpoint",
    shenuteTitle: "Shenute AI API",
    shenuteUiLabel: "Shenute UI",
    title: "Coptic Compass Grammar + Shenute AI Docs",
  },
  nl: {
    apiIndexLabel: "API-index",
    breadcrumbLabel: "API-docs",
    developerGuideLabel: "Ontwikkelaarsgids",
    description:
      "Verken de publieke grammaticadataset in Swagger en integreer Shenute AI met providerkeuze en OCR-context voor afbeeldingen.",
    grammarHubLabel: "Grammaticahub",
    highlights: [
      "Alleen-lezen en geversioneerde responses",
      "Swagger UI plus ruwe OpenAPI JSON",
      "Lesfilters accepteren een slug of canonieke id",
      "Rechtenmetadata inbegrepen in de dataset",
      "Shenute AI-endpoint beschikbaar via /api/shenute",
      "OCR-proxyendpoint beschikbaar via /api/ocr",
      "Afbeeldings- en cameraprompts ondersteunen OCR-context",
    ],
    metadataDescription:
      "Swagger-ondersteunde API-documentatie voor de publieke grammaticadataset van Coptic Compass, plus integratiehulp voor Shenute AI en OCR.",
    metadataTitle: "Coptic Compass-API-docs voor grammatica en Shenute AI",
    ocrDescriptionAfterLang: "(of een andere taal) meegeven en",
    ocrDescriptionEnd:
      "instellen wanneer uw backend een specifieke uploadveldnaam verwacht.",
    ocrDescriptionForward:
      "met multipart-formulierdata. Coptic Compass stuurt het bestand door naar",
    ocrDescriptionReturn:
      "en geeft daarna de upstream OCR-responsebody en content-type terug aan de client. U kunt",
    ocrProxyLabel: "OCR-proxy",
    ocrTitle: "OCR-proxy-API",
    openApiLabel: "OpenAPI JSON",
    overviewDataset:
      "voor tooling. De publieke dataset ontsluit alleen gepubliceerde lessen en hun gerelateerde records. Shenute AI is beschikbaar via",
    overviewEnd:
      "als standaardprovider wanneer geen expliciete provider wordt meegegeven. OCR-requests kunnen via",
    overviewInstead:
      "worden geproxyd in plaats van de upstream OCR-service rechtstreeks aan te roepen.",
    overviewOpenApi: "voor ontdekking of",
    overviewProvider: "met",
    overviewStart: "Publieke gebruikers beginnen meestal met",
    shenuteDescriptionFallback:
      "Wanneer Hugging Face door een limiet wordt geblokkeerd, kan de API terugvallen op geconfigureerde alternatieven.",
    shenuteDescriptionJoin: "en",
    shenuteDescriptionProviders: "Ondersteunde providers zijn",
    shenuteDescriptionStart: "Gebruik",
    shenuteDescriptionWith: "met een UI-message-payload.",
    shenuteEndpointLabel: "Shenute-endpoint",
    shenuteTitle: "Shenute AI-API",
    shenuteUiLabel: "Shenute UI",
    title: "Coptic Compass-docs voor grammatica en Shenute AI",
  },
} as const;

const SHENUTE_API_EXAMPLES = {
  en: `const response = await fetch("https://www.copticcompass.com/api/shenute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    inferenceProvider: "thoth",
    messages: [
      {
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "Explain this Coptic phrase." }],
      },
    ],
  }),
});

const result = await response.text();`,
  nl: `const response = await fetch("https://www.copticcompass.com/api/shenute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    inferenceProvider: "thoth",
    messages: [
      {
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "Leg deze Koptische zin uit." }],
      },
    ],
  }),
});

const result = await response.text();`,
} as const satisfies Record<Language, string>;

const OCR_INTEGRATION_EXAMPLES = {
  en: `# .env.local
OCR_SERVICE_URL=https://your-ocr-service/upload
# Optional when your backend expects a specific multipart field:
OCR_UPLOAD_FIELD=file

curl -X POST "https://www.copticcompass.com/api/ocr?lang=cop" \\
  -F "file=@/path/to/coptic-image.jpg"

# Proxy flow
# 1) Client sends multipart/form-data to /api/ocr
# 2) Coptic Compass forwards to OCR_SERVICE_URL
# 3) Upstream OCR response is returned to the client`,
  nl: `# .env.local
OCR_SERVICE_URL=https://your-ocr-service/upload
# Optioneel wanneer uw backend een specifieke multipart-veldnaam verwacht:
OCR_UPLOAD_FIELD=file

curl -X POST "https://www.copticcompass.com/api/ocr?lang=cop" \\
  -F "file=@/path/to/coptic-image.jpg"

# Proxyflow
# 1) Client stuurt multipart/form-data naar /api/ocr
# 2) Coptic Compass stuurt door naar OCR_SERVICE_URL
# 3) De upstream OCR-response wordt teruggegeven aan de client`,
} as const satisfies Record<Language, string>;

type ApiDocsCopy = (typeof API_DOCS_COPY)[Language];

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();
  const copy = API_DOCS_COPY[language];

  return createPageMetadata({
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    path: "/api-docs",
  });
}

function ApiDocsOverview({ copy }: { copy: ApiDocsCopy }) {
  return (
    <p className="text-sm leading-7 text-muted">
      {copy.overviewStart} <code>/api/v1/grammar</code> {copy.overviewOpenApi}{" "}
      <code>/api/openapi.json</code> {copy.overviewDataset}{" "}
      <code>/api/shenute</code>, {copy.overviewProvider} <code>openrouter</code>{" "}
      {copy.overviewEnd} <code>/api/ocr</code> {copy.overviewInstead}
    </p>
  );
}

function ShenuteApiDescription({ copy }: { copy: ApiDocsCopy }) {
  return (
    <p className="text-sm leading-7 text-muted">
      {copy.shenuteDescriptionStart} <code>POST /api/shenute</code>{" "}
      {copy.shenuteDescriptionWith} {copy.shenuteDescriptionProviders}{" "}
      <code>openrouter</code>, <code>gemini</code>,{" "}
      {copy.shenuteDescriptionJoin} <code>hf</code>.{" "}
      {copy.shenuteDescriptionFallback}
    </p>
  );
}

function OcrApiDescription({ copy }: { copy: ApiDocsCopy }) {
  return (
    <p className="text-sm leading-7 text-muted">
      {copy.shenuteDescriptionStart} <code>POST /api/ocr</code>{" "}
      {copy.ocrDescriptionForward} <code>OCR_SERVICE_URL</code>,{" "}
      {copy.ocrDescriptionReturn} <code>?lang=cop</code>{" "}
      {copy.ocrDescriptionAfterLang} <code>OCR_UPLOAD_FIELD</code>{" "}
      {copy.ocrDescriptionEnd}
    </p>
  );
}

/**
 * Renders the Swagger-backed documentation page for the public grammar API.
 */
export default async function ApiDocsPage() {
  const language = await getPreferredLanguage();
  const copy = API_DOCS_COPY[language];

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 md:p-10"
      contentClassName="w-full space-y-10 pt-10"
      width="standard"
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrbSoft,
      ]}
    >
      <BreadcrumbTrail
        items={[
          {
            label: getTranslation(language, "nav.home"),
            href: getLocalizedHomePath(language),
          },
          {
            label: getTranslation(language, "nav.developers"),
            href: getDevelopersPath(language),
          },
          { label: copy.breadcrumbLabel },
        ]}
      />

      <PageHeader
        title={copy.title}
        description={copy.description}
        tone="sky"
        size="workspace"
      />

      <section className="section-card space-y-5">
        <div className="flex flex-wrap gap-3">
          <Link href={getDevelopersPath(language)} className="btn-secondary">
            {copy.developerGuideLabel}
          </Link>
          <Link href="/api/openapi.json" className="btn-secondary">
            {copy.openApiLabel}
          </Link>
          <Link href="/api/v1/grammar" className="btn-secondary">
            {copy.apiIndexLabel}
          </Link>
          <Link href="/api/shenute" className="btn-secondary">
            {copy.shenuteEndpointLabel}
          </Link>
          <Link href="/api/ocr" className="btn-secondary">
            {copy.ocrProxyLabel}
          </Link>
          <Link href="/shenute" className="btn-secondary">
            {copy.shenuteUiLabel}
          </Link>
          <Link href={getGrammarPath(language)} className="btn-secondary">
            {copy.grammarHubLabel}
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {copy.highlights.map((highlight) => (
            <div
              key={highlight}
              className="badge-accent justify-center px-4 py-3 text-center text-sm"
            >
              {highlight}
            </div>
          ))}
        </div>

        <ApiDocsOverview copy={copy} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="section-card space-y-4">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {copy.shenuteTitle}
          </h2>
          <ShenuteApiDescription copy={copy} />
          <pre className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-100 dark:border-stone-800/80">
            <code>{SHENUTE_API_EXAMPLES[language]}</code>
          </pre>
        </article>

        <article className="section-card space-y-4">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {copy.ocrTitle}
          </h2>
          <OcrApiDescription copy={copy} />
          <pre className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-100 dark:border-stone-800/80">
            <code>{OCR_INTEGRATION_EXAMPLES[language]}</code>
          </pre>
        </article>
      </section>

      <section className="section-card overflow-hidden">
        <SwaggerDocsClient specUrl="/api/openapi.json" />
      </section>
    </PageShell>
  );
}
