"use client";

import { useEffect } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { pageShellAccents } from "@/components/PageShell";
import { RouteErrorState } from "@/components/RouteErrorState";

const API_DOCS_ERROR_COPY = {
  en: {
    description:
      "The documentation view ran into a temporary problem before Swagger finished rendering.",
    details:
      "You can retry the interactive docs, or fall back to the raw OpenAPI document while this page recovers.",
    noticeTitle: "Something interrupted this page",
    primaryLabel: "Open raw spec",
    retryLabel: "Try again",
    title: "We couldn't load the API docs",
  },
  nl: {
    description:
      "De documentatieweergave kreeg een tijdelijk probleem voordat Swagger klaar was met renderen.",
    details:
      "U kunt de interactieve docs opnieuw proberen of tijdelijk terugvallen op het ruwe OpenAPI-document.",
    noticeTitle: "Deze pagina werd onderbroken",
    primaryLabel: "Ruwe specificatie openen",
    retryLabel: "Opnieuw proberen",
    title: "De API-docs konden niet worden geladen",
  },
} as const;

/**
 * Renders the fallback error boundary for the API documentation page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const copy = API_DOCS_ERROR_COPY[language];

  useEffect(() => {
    console.error("API docs route failed to render", error);
  }, [error]);

  return (
    <RouteErrorState
      title={copy.title}
      description={copy.description}
      details={copy.details}
      noticeTitle={copy.noticeTitle}
      tone="sky"
      primaryHref="/api/openapi.json"
      primaryLabel={copy.primaryLabel}
      reset={reset}
      retryLabel={copy.retryLabel}
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrbSoft,
      ]}
    />
  );
}
