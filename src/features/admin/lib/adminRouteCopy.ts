import type { Language } from "@/types/i18n";

export const adminRouteCopy = {
  en: {
    errorDescription:
      "The review workspace ran into a temporary issue while preparing submissions.",
    errorDetails:
      "Submission data or review controls were interrupted before the page finished rendering. Try again first, and if the issue persists, return to the student dashboard while we investigate.",
    errorNoticeTitle: "Something interrupted this page",
    errorPrimaryLabel: "Open dashboard",
    errorRetryLabel: "Try again",
    errorTitle: "We couldn't load the instructor queue",
    loadingDescription:
      "Loading exercise submissions, ratings, and instructor tools.",
    loadingTitle: "Preparing the review queue",
    metaDescription:
      "Private instructor workspace for reviewing grammar submissions.",
    metaTitle: "Instructor Workspace",
    pageDescription:
      "Review submitted exercises, score translations, and send feedback.",
    pageTitle: "Instructor Terminal",
  },
  nl: {
    errorDescription:
      "De beoordelingswerkruimte kreeg een tijdelijk probleem bij het voorbereiden van inzendingen.",
    errorDetails:
      "Inzendingsgegevens of beoordelingsfuncties werden onderbroken voordat de pagina klaar was met laden. Probeer het eerst opnieuw. Blijft het probleem bestaan, ga dan terug naar het dashboard terwijl we dit onderzoeken.",
    errorNoticeTitle: "Deze pagina werd onderbroken",
    errorPrimaryLabel: "Dashboard openen",
    errorRetryLabel: "Opnieuw proberen",
    errorTitle: "De beoordelingswachtrij kon niet worden geladen",
    loadingDescription:
      "Oefeninzendingen, beoordelingen en docenttools worden geladen.",
    loadingTitle: "Beoordelingswachtrij voorbereiden",
    metaDescription:
      "Private docentenwerkruimte voor het beoordelen van grammatica-inzendingen.",
    metaTitle: "Docentenwerkruimte",
    pageDescription:
      "Beoordeel ingediende oefeningen, geef vertalingen een score en stuur feedback terug.",
    pageTitle: "Docententerminal",
  },
} as const satisfies Record<
  Language,
  {
    errorDescription: string;
    errorDetails: string;
    errorNoticeTitle: string;
    errorPrimaryLabel: string;
    errorRetryLabel: string;
    errorTitle: string;
    loadingDescription: string;
    loadingTitle: string;
    metaDescription: string;
    metaTitle: string;
    pageDescription: string;
    pageTitle: string;
  }
>;
