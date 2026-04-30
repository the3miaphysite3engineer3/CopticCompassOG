"use client";

import { Camera, FileText, ScanSearch } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import { processOCRImage } from "@/actions/ocrActions";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { buttonClassName } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";
import { getLocalizedHomePath } from "@/lib/locale";

const OCR_COPY = {
  en: {
    bestFor: "Best for clear manuscript crops and high-contrast scans.",
    description:
      "Upload a manuscript photo or scanned page and extract text into a reusable reading surface.",
    emptyDescription:
      "Upload an image and run Shenute OCR to preview extracted text here.",
    emptyTitle: "No OCR output yet",
    extract: "Extract Text",
    extractedDescription:
      "Review the OCR output before reusing it in Shenute AI or research notes.",
    extractedTitle: "Extracted Text",
    fallbackError: "Failed to process OCR.",
    imageLabel: "Knowledge image",
    running: "Running OCR...",
    selectedFile: "Selected file:",
    title: "Shenute OCR",
    workflowDescription:
      "The uploaded image is sent to the configured OCR service and returned as plain extracted text for review and reuse.",
    workflowTitle: "OCR Workflow",
  },
  nl: {
    bestFor:
      "Werkt het best met duidelijke manuscriptuitsneden en scans met hoog contrast.",
    description:
      "Upload een manuscriptfoto of gescande pagina en haal de tekst eruit voor hergebruik in uw studieomgeving.",
    emptyDescription:
      "Upload een afbeelding en voer Shenute OCR uit om de herkende tekst hier te bekijken.",
    emptyTitle: "Nog geen OCR-uitvoer",
    extract: "Tekst herkennen",
    extractedDescription:
      "Controleer de OCR-uitvoer voordat u die opnieuw gebruikt in Shenute AI of onderzoeksnotities.",
    extractedTitle: "Herkende tekst",
    fallbackError: "OCR-verwerking is mislukt.",
    imageLabel: "Kennisafbeelding",
    running: "OCR uitvoeren...",
    selectedFile: "Geselecteerd bestand:",
    title: "Shenute OCR",
    workflowDescription:
      "De geuploade afbeelding wordt naar de geconfigureerde OCR-service gestuurd en komt terug als platte herkende tekst voor controle en hergebruik.",
    workflowTitle: "OCR-workflow",
  },
} as const;

/**
 * Provides a lightweight OCR workspace for testing Coptic image extraction
 * without leaving the shared app shell and form styling behind.
 */
export default function OCRPage() {
  const { language, t } = useLanguage();
  const copy = OCR_COPY[language];
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setImage(nextFile);
    setError("");

    if (!nextFile) {
      setResult("");
    }
  };

  const handleUpload = async () => {
    if (!image) {
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const formData = new FormData();
      formData.append("file", image);

      const extractedText = await processOCRImage(formData);
      setResult(extractedText);
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : copy.fallbackError,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="mx-auto w-full max-w-4xl space-y-8 pt-8 md:pt-10"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      <BreadcrumbTrail
        items={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: copy.title },
        ]}
      />

      <SurfacePanel rounded="4xl" shadow="float" className="p-6 md:p-8">
        <PageHeader
          title={copy.title}
          description={copy.description}
          align="left"
          size="workspace"
          tone="sky"
        />
      </SurfacePanel>

      <SurfacePanel rounded="4xl" shadow="panel" className="p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]">
          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                {copy.imageLabel}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full rounded-xl border border-stone-200 bg-white/80 px-3 py-2 text-sm text-stone-900 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/35 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:file:bg-sky-900/40 dark:file:text-sky-200"
              />
            </label>

            {error ? (
              <StatusNotice tone="error" align="left">
                {error}
              </StatusNotice>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleUpload();
                }}
                disabled={!image || loading}
                className={buttonClassName({ className: "px-5" })}
              >
                <ScanSearch className="h-4 w-4" />
                {loading ? copy.running : copy.extract}
              </button>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {copy.bestFor}
              </p>
            </div>
          </div>

          <SurfacePanel
            rounded="3xl"
            variant="subtle"
            shadow="soft"
            className="p-5"
          >
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                <Camera className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {copy.workflowTitle}
                </h2>
                <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
                  {copy.workflowDescription}
                </p>
              </div>
              {image ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300">
                  {copy.selectedFile}{" "}
                  <span className="font-semibold">{image.name}</span>
                </div>
              ) : null}
            </div>
          </SurfacePanel>
        </div>
      </SurfacePanel>

      {result ? (
        <SurfacePanel rounded="4xl" shadow="panel" className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {copy.extractedTitle}
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {copy.extractedDescription}
              </p>
            </div>
          </div>
          <pre className="whitespace-pre-wrap rounded-3xl border border-stone-200 bg-stone-50/80 p-5 font-coptic text-lg leading-8 text-stone-800 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-200">
            {result}
          </pre>
        </SurfacePanel>
      ) : (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      )}
    </PageShell>
  );
}
