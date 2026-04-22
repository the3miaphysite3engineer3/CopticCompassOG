import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import {
  AdminContentReleasesList,
  AdminContactMessagesList,
  AdminEntryReportsList,
  AdminSubmissionsList,
} from "@/features/admin/components/AdminFilteredLists";
import { AdminOverflowDisclosure } from "@/features/admin/components/AdminListPrimitives";
import { AdminPersistentSection } from "@/features/admin/components/AdminPersistentSection";
import { AdminRagIngestionForm } from "@/features/admin/components/AdminRagIngestionForm";
import {
  countActionableContentReleases,
  countOpenContactMessages,
  countOpenEntryReports,
  countPendingSubmissions,
  type AdminDashboardData,
  type AdminWorkspaceOverview,
} from "@/features/admin/lib/dashboardData";
import { splitAdminVisibleItems } from "@/features/admin/lib/listPrimitives";
import type { AdminWorkspaceMode } from "@/features/admin/lib/workspaceMode";
import { AdminAudienceContactCard } from "@/features/communications/components/AdminAudienceContactCard";
import { CreateContentReleaseForm } from "@/features/communications/components/CreateContentReleaseForm";
import { SyncAudienceContactsForm } from "@/features/communications/components/SyncAudienceContactsForm";
import { AdminNotificationEventCard } from "@/features/notifications/components/AdminNotificationEventCard";
import type { Language } from "@/types/i18n";

const adminDashboardSectionsCopy = {
  en: {
    audience: {
      dbError:
        "Database Error: Could not load audience contacts. Make sure you've run the latest SQL setup script.",
      description:
        "Track who has opted into release emails before you start sending lesson or publication announcements. The list keeps actionable contacts in full and shows a recent inactive window below them.",
      emptyDescription:
        "Opt-ins from the contact form, signup flow, and dashboard preferences will appear here.",
      emptyTitle: "No audience contacts yet.",
      lessons: "Lessons",
      noSummary: "No contacts yet",
      overflowLabel: "audience contact",
      overflowPluralLabel: "audience contacts",
      reachable: "reachable",
      summaryTotal: "total",
      synced: "Synced",
      syncErrors: "Sync errors",
      title: "Audience communication",
    },
    communicationsDesk: {
      activeReleases: "Active releases",
      audienceSyncDescription:
        "Push the current audience preferences to Resend before sending a release, especially after new signups or preference changes.",
      audienceSyncTitle: "Audience sync",
      badge: "Communications Desk",
      booksGeneral: "Books + general",
      description:
        "Draft new announcements here, keep the audience in sync with Resend, and let the release and contact history sit further down the page instead of crowding the compose flow.",
      draftInputsDescription:
        "Published lessons and publications currently available to announce.",
      draftInputsLabel: "Draft inputs",
      inQueueDescription:
        "Releases already queued or actively delivering in the background.",
      inQueueLabel: "In queue",
      lessons: "Lessons",
      reachableAudienceDescription:
        "Contacts who can receive lessons, books, or general updates now.",
      reachableAudienceLabel: "Reachable audience",
      synced: "Synced",
      syncErrors: "Sync errors",
      syncHealthDescription:
        "Contacts with sync issues that need a resend or manual check.",
      syncHealthLabel: "Sync health",
      title: "Plan releases without carrying the review queues with you",
    },
    contactInbox: {
      active: "Active",
      answered: "Answered",
      dbError:
        "Database Error: Could not load contact messages. Make sure you've run the latest SQL setup script.",
      description:
        "Triage public contact messages, keep track of replies, and note who wants future updates.",
      emptyDescription:
        "When visitors send a message from the contact page, it will appear here for follow-up.",
      emptyTitle: "No contact messages yet.",
      summaryLabels: {
        active: "active",
        none: "No messages",
        plural: "messages",
        singular: "message",
        total: "total",
      },
      title: "Contact inbox",
    },
    entryReports: {
      dbError:
        "Database Error: Could not load dictionary entry reports. Make sure you've run the latest SQL setup script.",
      description:
        "Review flagged lemmas, inspect the current published meaning, and move each report through your inbox.",
      emptyDescription:
        "When readers flag entries from the dictionary, they will appear here for review.",
      emptyTitle: "No dictionary reports yet.",
      open: "Open",
      resolved: "Resolved",
      summaryLabels: {
        active: "active",
        none: "No reports",
        plural: "reports",
        singular: "report",
        total: "total",
      },
      title: "Dictionary entry reports",
    },
    notifications: {
      attentionDescription:
        "Failures and still-queued notifications stay at the top.",
      attentionLabel: "Needs attention",
      dbError:
        "Database Error: Could not load notification activity. Make sure you've run the latest SQL setup script.",
      description:
        "Use this as a reference area for delivery health: failed or queued events first, then a bounded recent success log beneath.",
      emptyDescription:
        "Notification events will appear here once contact alerts, submission alerts, and review emails have been sent.",
      emptyHistory:
        "Successful sends will collect here once the system starts delivering notifications.",
      emptyIssues: "No notification issues are waiting right now.",
      emptyTitle: "No notification activity yet.",
      failed: "Failed",
      historyDescription:
        "Successful sends stay available here as a quieter recent audit trail.",
      historyLabel: "Recent delivery log",
      historyOverflowLabel: "history event",
      historyOverflowPluralLabel: "history events",
      noSummary: "No notification activity yet",
      notificationOverflowLabel: "notification",
      notificationOverflowPluralLabel: "notifications",
      recentSent: "Recent sent",
      sentInRecentLog: "sent in recent log",
      title: "Notification log",
    },
    quickJump: {
      badge: "Quick Jump",
      descriptions: {
        communications:
          "Focus on outbound announcements and audience health without carrying the review queues with you.",
        review:
          "Stay inside the live teaching queues. History now lives inside each section, so this view stays focused on work that still needs you.",
        system:
          "Inspect delivery health and operational alerts without the rest of the workspace competing for attention.",
      },
      links: {
        alerts: "Alerts",
        audience: "Audience",
        inbox: "Inbox",
        releases: "Releases",
        reports: "Reports",
        submissions: "Submissions",
      },
    },
    rag: {
      description:
        "Upload knowledge files to enrich Shenute AI context. Files are parsed, OCR-checked, chunked (default target 1600 chars with 200 overlap), embedded via your selected provider (Hugging Face or Gemini), and stored in pgvector. RAG status also tracks dictionary.json and grammar JSON knowledge sources.",
      destination: "Destination",
      embeddings: "Embeddings",
      selectable: "selectable",
      summary: "Multi-file ingestion with OCR + embeddings",
      title: "RAG knowledge ingestion",
    },
    releases: {
      active: "active",
      candidates: "Candidates",
      dbError:
        "Database Error: Could not load content releases. Make sure you've run the latest SQL setup script.",
      description:
        "Build snapshot-based announcement drafts for published lessons and publications. The list below shows the latest release activity window so the workspace stays lightweight.",
      emptyDescription:
        "Create a draft above to snapshot the published lessons or publications you want to announce.",
      emptyTitle: "No release drafts yet.",
      inQueue: "In queue",
      noSummary: "No release drafts yet",
      readyOrLive: "Ready or live",
      recentWindow: "in recent window",
      title: "Release drafts",
    },
    reviewInbox: {
      activeDescription:
        "Start with the live queues below. Reviewed, archived, and resolved work stays tucked into each section's history view so this mode can stay calm.",
      activeTitleSuffix: "active items need attention",
      badge: "Review Inbox",
      clearDescription:
        "Nothing urgent is waiting right now. You can still open each section to revisit history or switch into Communications and System when you want the slower administrative work.",
      clearTitle: "Your review queues are clear",
      liveQueues: "Live queues",
      links: {
        inbox: {
          label: "Inbox",
          note: "Open conversations from learners and visitors.",
        },
        reports: {
          label: "Reports",
          note: "Dictionary feedback and entry issues to resolve.",
        },
        submissions: {
          label: "Submissions",
          note: "Translation work waiting for scoring and feedback.",
        },
      },
    },
    submissions: {
      dbError:
        "Database Error: Could not load submissions. Make sure you've run the SQL setup script.",
      description:
        "Review translation work, assign a score, and return feedback to students.",
      needsReview: "Needs review",
      reviewed: "Reviewed",
      summaryLabels: {
        active: "active",
        none: "No submissions",
        plural: "submissions",
        singular: "submission",
        total: "total",
      },
      title: "Exercise submissions",
    },
    systemHealth: {
      badge: "System Health",
      description:
        "This mode is meant for quiet operational checks. Failures and queued sends surface first, while successful delivery history sits below as a reference log.",
      failedDescription: "Notifications that need investigation or a resend.",
      failedLabel: "Failed",
      failedNotifications: "Failed notifications",
      issuePlural: "delivery issues need attention",
      issueSingular: "delivery issue needs attention",
      queuedDescription:
        "Events that are waiting to process or still completing.",
      queuedLabel: "Queued",
      recentSentDescription:
        "Successfully delivered notifications in the recent log window.",
      recentSentLabel: "Recent sent",
      steadyTitle: "Delivery health is steady",
    },
  },
  nl: {
    audience: {
      dbError:
        "Databasefout: publiekscontacten konden niet worden geladen. Controleer of u het nieuwste SQL-installatiescript hebt uitgevoerd.",
      description:
        "Volg wie zich heeft aangemeld voor release-e-mails voordat u les- of publicatieaankondigingen verstuurt. De lijst toont actiegerichte contacten volledig en plaatst een recent inactief venster daaronder.",
      emptyDescription:
        "Aanmeldingen via het contactformulier, de registratieflow en dashboardvoorkeuren verschijnen hier.",
      emptyTitle: "Nog geen publiekscontacten.",
      lessons: "Lessen",
      noSummary: "Nog geen contacten",
      overflowLabel: "publiekscontact",
      overflowPluralLabel: "publiekscontacten",
      reachable: "bereikbaar",
      summaryTotal: "totaal",
      synced: "Gesynchroniseerd",
      syncErrors: "Synchronisatiefouten",
      title: "Publiekscommunicatie",
    },
    communicationsDesk: {
      activeReleases: "Actieve releases",
      audienceSyncDescription:
        "Stuur de huidige publieksvoorkeuren naar Resend voordat u een release verstuurt, vooral na nieuwe aanmeldingen of voorkeurwijzigingen.",
      audienceSyncTitle: "Publiekssynchronisatie",
      badge: "Communicatiedesk",
      booksGeneral: "Boeken + algemeen",
      description:
        "Maak hier nieuwe aankondigingen, houd het publiek gesynchroniseerd met Resend en laat release- en contactgeschiedenis lager op de pagina staan zodat de opstelstroom rustig blijft.",
      draftInputsDescription:
        "Gepubliceerde lessen en publicaties die nu aangekondigd kunnen worden.",
      draftInputsLabel: "Conceptbronnen",
      inQueueDescription:
        "Releases die al in de wachtrij staan of op de achtergrond worden verzonden.",
      inQueueLabel: "In wachtrij",
      lessons: "Lessen",
      reachableAudienceDescription:
        "Contacten die nu lessen, boeken of algemene updates kunnen ontvangen.",
      reachableAudienceLabel: "Bereikbaar publiek",
      synced: "Gesynchroniseerd",
      syncErrors: "Synchronisatiefouten",
      syncHealthDescription:
        "Contacten met synchronisatieproblemen waarvoor opnieuw verzenden of een handmatige controle nodig is.",
      syncHealthLabel: "Synchronisatiestatus",
      title: "Plan releases zonder de beoordelingswachtrijen erbij te houden",
    },
    contactInbox: {
      active: "Actief",
      answered: "Beantwoord",
      dbError:
        "Databasefout: contactberichten konden niet worden geladen. Controleer of u het nieuwste SQL-installatiescript hebt uitgevoerd.",
      description:
        "Behandel openbare contactberichten, houd antwoorden bij en noteer wie toekomstige updates wil ontvangen.",
      emptyDescription:
        "Wanneer bezoekers een bericht via de contactpagina sturen, verschijnt het hier voor opvolging.",
      emptyTitle: "Nog geen contactberichten.",
      summaryLabels: {
        active: "actief",
        none: "Geen berichten",
        plural: "berichten",
        singular: "bericht",
        total: "totaal",
      },
      title: "Contactinbox",
    },
    entryReports: {
      dbError:
        "Databasefout: woordenboekmeldingen konden niet worden geladen. Controleer of u het nieuwste SQL-installatiescript hebt uitgevoerd.",
      description:
        "Beoordeel gemarkeerde lemma's, controleer de huidige gepubliceerde betekenis en verwerk elk rapport in uw inbox.",
      emptyDescription:
        "Wanneer lezers woordenboekitems markeren, verschijnen ze hier voor beoordeling.",
      emptyTitle: "Nog geen woordenboekmeldingen.",
      open: "Open",
      resolved: "Opgelost",
      summaryLabels: {
        active: "actief",
        none: "Geen rapporten",
        plural: "rapporten",
        singular: "rapport",
        total: "totaal",
      },
      title: "Woordenboekmeldingen",
    },
    notifications: {
      attentionDescription:
        "Mislukte en nog wachtrijstaande meldingen blijven bovenaan.",
      attentionLabel: "Vraagt aandacht",
      dbError:
        "Databasefout: meldingsactiviteit kon niet worden geladen. Controleer of u het nieuwste SQL-installatiescript hebt uitgevoerd.",
      description:
        "Gebruik dit als referentiegebied voor leveringsstatus: mislukte of wachtrijstaande events eerst, daarna een begrensd recent succeslog.",
      emptyDescription:
        "Meldingsevents verschijnen hier zodra contactmeldingen, inzendingsmeldingen en beoordelingsmails zijn verstuurd.",
      emptyHistory:
        "Succesvolle verzendingen worden hier verzameld zodra het systeem meldingen begint te bezorgen.",
      emptyIssues: "Er wachten nu geen meldingsproblemen.",
      emptyTitle: "Nog geen meldingsactiviteit.",
      failed: "Mislukt",
      historyDescription:
        "Succesvolle verzendingen blijven hier beschikbaar als rustig recent auditspoor.",
      historyLabel: "Recent leveringslog",
      historyOverflowLabel: "geschiedenisitem",
      historyOverflowPluralLabel: "geschiedenisitems",
      noSummary: "Nog geen meldingsactiviteit",
      notificationOverflowLabel: "melding",
      notificationOverflowPluralLabel: "meldingen",
      recentSent: "Recent verzonden",
      sentInRecentLog: "verzonden in recent log",
      title: "Meldingenlog",
    },
    quickJump: {
      badge: "Snelle sprong",
      descriptions: {
        communications:
          "Richt u op uitgaande aankondigingen en publieksstatus zonder de beoordelingswachtrijen erbij te houden.",
        review:
          "Blijf in de actieve onderwijswachtrijen. Geschiedenis staat nu in elke sectie, zodat deze weergave gericht blijft op werk dat nog aandacht vraagt.",
        system:
          "Controleer leveringsstatus en operationele meldingen zonder dat de rest van de werkruimte om aandacht vraagt.",
      },
      links: {
        alerts: "Meldingen",
        audience: "Publiek",
        inbox: "Inbox",
        releases: "Releases",
        reports: "Rapporten",
        submissions: "Inzendingen",
      },
    },
    rag: {
      description:
        "Upload kennisbestanden om de context van Shenute AI te verrijken. Bestanden worden geparsed, via OCR gecontroleerd, in chunks verdeeld (standaarddoel 1600 tekens met 200 overlap), ingebed via de geselecteerde provider (Hugging Face of Gemini) en opgeslagen in pgvector. De RAG-status volgt ook dictionary.json en grammatica-JSON-kennisbronnen.",
      destination: "Bestemming",
      embeddings: "Embeddings",
      selectable: "selecteerbaar",
      summary: "Invoer van meerdere bestanden met OCR + embeddings",
      title: "RAG-kennisinvoer",
    },
    releases: {
      active: "actief",
      candidates: "Kandidaten",
      dbError:
        "Databasefout: releaseconcepten konden niet worden geladen. Controleer of u het nieuwste SQL-installatiescript hebt uitgevoerd.",
      description:
        "Maak snapshotgebaseerde aankondigingsconcepten voor gepubliceerde lessen en publicaties. De lijst hieronder toont de nieuwste release-activiteit zodat de werkruimte licht blijft.",
      emptyDescription:
        "Maak hierboven een concept om de gepubliceerde lessen of publicaties vast te leggen die u wilt aankondigen.",
      emptyTitle: "Nog geen releaseconcepten.",
      inQueue: "In wachtrij",
      noSummary: "Nog geen releaseconcepten",
      readyOrLive: "Klaar of live",
      recentWindow: "in recent venster",
      title: "Releaseconcepten",
    },
    reviewInbox: {
      activeDescription:
        "Begin met de actieve wachtrijen hieronder. Beoordeeld, gearchiveerd en opgelost werk staat in de geschiedenis van elke sectie, zodat deze modus rustig blijft.",
      activeTitleSuffix: "actieve items vragen aandacht",
      badge: "Beoordelingsinbox",
      clearDescription:
        "Er wacht nu niets dringends. U kunt elke sectie openen om geschiedenis te bekijken of overschakelen naar Communicatie en Systeem voor trager administratief werk.",
      clearTitle: "Uw beoordelingswachtrijen zijn leeg",
      liveQueues: "Actieve wachtrijen",
      links: {
        inbox: {
          label: "Inbox",
          note: "Open gesprekken van studenten en bezoekers.",
        },
        reports: {
          label: "Rapporten",
          note: "Woordenboekfeedback en itemproblemen om op te lossen.",
        },
        submissions: {
          label: "Inzendingen",
          note: "Vertaalwerk dat wacht op score en feedback.",
        },
      },
    },
    submissions: {
      dbError:
        "Databasefout: inzendingen konden niet worden geladen. Controleer of u het SQL-installatiescript hebt uitgevoerd.",
      description:
        "Beoordeel vertaalwerk, geef een score en stuur feedback terug naar studenten.",
      needsReview: "Te beoordelen",
      reviewed: "Beoordeeld",
      summaryLabels: {
        active: "actief",
        none: "Geen inzendingen",
        plural: "inzendingen",
        singular: "inzending",
        total: "totaal",
      },
      title: "Oefeninzendingen",
    },
    systemHealth: {
      badge: "Systeemstatus",
      description:
        "Deze modus is bedoeld voor rustige operationele controles. Mislukkingen en wachtrij-items komen eerst; succesvolle leveringsgeschiedenis staat daaronder als referentielog.",
      failedDescription:
        "Meldingen waarvoor onderzoek of opnieuw verzenden nodig is.",
      failedLabel: "Mislukt",
      failedNotifications: "Mislukte meldingen",
      issuePlural: "leveringsproblemen vragen aandacht",
      issueSingular: "leveringsprobleem vraagt aandacht",
      queuedDescription:
        "Events die wachten op verwerking of nog worden afgerond.",
      queuedLabel: "In wachtrij",
      recentSentDescription:
        "Succesvol bezorgde meldingen in het recente logvenster.",
      recentSentLabel: "Recent verzonden",
      steadyTitle: "De leveringsstatus is stabiel",
    },
  },
} as const;

type SectionSummaryLabels = {
  active: string;
  none: string;
  plural: string;
  singular: string;
  total: string;
};

function formatAdminNumber(value: number, language: Language) {
  return value.toLocaleString(language === "nl" ? "nl-BE" : "en-US");
}

function AdminDatabaseErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
      {message}
    </div>
  );
}

function buildSectionSummary({
  active,
  labels,
  language,
  total,
}: {
  active: number;
  labels: SectionSummaryLabels;
  language: Language;
  total: number;
}) {
  if (total === 0) {
    return labels.none;
  }

  if (active <= 0) {
    return `${formatAdminNumber(total, language)} ${
      total === 1 ? labels.singular : labels.plural
    }`;
  }

  return `${formatAdminNumber(active, language)} ${labels.active} · ${formatAdminNumber(total, language)} ${labels.total}`;
}

export function AdminWorkspaceQuickJump({
  language,
  overview,
  mode,
}: {
  language: Language;
  overview: AdminWorkspaceOverview;
  mode: AdminWorkspaceMode;
}) {
  const copy = adminDashboardSectionsCopy[language].quickJump;
  const allLinks = {
    communications: [
      {
        count: overview.actionableReleaseCount,
        href: "#admin-releases",
        label: copy.links.releases,
        tone: overview.actionableReleaseCount > 0 ? "coptic" : "surface",
      },
      {
        count: overview.audienceSyncErrorCount,
        href: "#admin-audience",
        label: copy.links.audience,
        tone: overview.audienceSyncErrorCount > 0 ? "accent" : "surface",
      },
    ],
    review: [
      {
        count: overview.pendingSubmissionCount,
        href: "#admin-submissions",
        label: copy.links.submissions,
        tone: overview.pendingSubmissionCount > 0 ? "accent" : "surface",
      },
      {
        count: overview.openContactMessageCount,
        href: "#admin-contact-inbox",
        label: copy.links.inbox,
        tone: overview.openContactMessageCount > 0 ? "accent" : "surface",
      },
      {
        count: overview.openEntryReportCount,
        href: "#admin-entry-reports",
        label: copy.links.reports,
        tone: overview.openEntryReportCount > 0 ? "accent" : "surface",
      },
    ],
    system: [
      {
        count: overview.failedNotificationCount,
        href: "#admin-notifications",
        label: copy.links.alerts,
        tone: overview.failedNotificationCount > 0 ? "accent" : "surface",
      },
    ],
  } as const;

  const links = allLinks[mode];
  const modeDescription = copy.descriptions[mode];

  return (
    <nav className="app-sticky-panel mb-8 rounded-[2rem] border border-stone-200/80 bg-white/85 p-4 shadow-lg backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/75 dark:shadow-black/20">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="flat" size="xs" caps>
          {copy.badge}
        </Badge>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {modeDescription}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
          >
            <Badge
              tone={link.tone}
              size="sm"
              className="transition hover:-translate-y-0.5"
            >
              {link.label}: {formatAdminNumber(link.count, language)}
            </Badge>
          </a>
        ))}
      </div>
    </nav>
  );
}

export function AdminReviewInboxSummary({
  language,
  overview,
}: {
  language: Language;
  overview: AdminWorkspaceOverview;
}) {
  const copy = adminDashboardSectionsCopy[language].reviewInbox;
  const reviewQueueTotal =
    overview.pendingSubmissionCount +
    overview.openContactMessageCount +
    overview.openEntryReportCount;
  const queueLinks = [
    {
      count: overview.pendingSubmissionCount,
      href: "#admin-submissions",
      label: copy.links.submissions.label,
      note: copy.links.submissions.note,
      tone: overview.pendingSubmissionCount > 0 ? "accent" : "surface",
    },
    {
      count: overview.openContactMessageCount,
      href: "#admin-contact-inbox",
      label: copy.links.inbox.label,
      note: copy.links.inbox.note,
      tone: overview.openContactMessageCount > 0 ? "accent" : "surface",
    },
    {
      count: overview.openEntryReportCount,
      href: "#admin-entry-reports",
      label: copy.links.reports.label,
      note: copy.links.reports.note,
      tone: overview.openEntryReportCount > 0 ? "accent" : "surface",
    },
  ] as const;

  return (
    <section className="rounded-[2rem] border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 p-6 shadow-lg shadow-sky-100/30 dark:border-sky-900/40 dark:from-sky-950/35 dark:via-stone-950 dark:to-emerald-950/20 dark:shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Badge tone="accent" size="xs" caps>
            {copy.badge}
          </Badge>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              {reviewQueueTotal > 0
                ? `${formatAdminNumber(reviewQueueTotal, language)} ${copy.activeTitleSuffix}`
                : copy.clearTitle}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-600 dark:text-stone-400">
              {reviewQueueTotal > 0
                ? copy.activeDescription
                : copy.clearDescription}
            </p>
          </div>
        </div>

        <Badge tone={reviewQueueTotal > 0 ? "coptic" : "surface"} size="sm">
          {copy.liveQueues}: {formatAdminNumber(reviewQueueTotal, language)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {queueLinks.map((queue) => (
          <a
            key={queue.href}
            href={queue.href}
            className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 dark:border-stone-800 dark:bg-stone-950/60 dark:hover:border-sky-900/50"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold text-stone-900 dark:text-stone-100">
                {queue.label}
              </span>
              <Badge tone={queue.tone} size="xs">
                {formatAdminNumber(queue.count, language)}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
              {queue.note}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

export function AdminCommunicationsDesk({
  audience,
  contentReleases,
  language,
  overview,
}: {
  audience: AdminDashboardData["audience"];
  contentReleases: AdminDashboardData["contentReleases"];
  language: Language;
  overview: AdminWorkspaceOverview;
}) {
  const copy = adminDashboardSectionsCopy[language].communicationsDesk;
  const totalCandidates =
    contentReleases.lessonReleaseCandidates.length +
    contentReleases.publicationReleaseCandidates.length;
  const reachableAudienceCount =
    audience.metrics.subscribedAudienceContactsCount;

  return (
    <section className="rounded-[2rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-sky-50/50 p-6 shadow-lg shadow-emerald-100/30 dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-stone-950 dark:to-sky-950/20 dark:shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Badge tone="coptic" size="xs" caps>
            {copy.badge}
          </Badge>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              {copy.title}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-600 dark:text-stone-400">
              {copy.description}
            </p>
          </div>
        </div>

        <Badge
          tone={overview.actionableReleaseCount > 0 ? "coptic" : "surface"}
          size="sm"
        >
          {copy.activeReleases}:{" "}
          {formatAdminNumber(overview.actionableReleaseCount, language)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.reachableAudienceLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(reachableAudienceCount, language)}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.reachableAudienceDescription}
          </p>
        </div>

        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.syncHealthLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(audience.metrics.resendSyncErrorCount, language)}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.syncHealthDescription}
          </p>
        </div>

        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.draftInputsLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(totalCandidates, language)}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.draftInputsDescription}
          </p>
        </div>

        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.inQueueLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(
              contentReleases.items.filter(
                (release) =>
                  release.status === "queued" || release.status === "sending",
              ).length,
              language,
            )}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.inQueueDescription}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <CreateContentReleaseForm
          lessonCandidates={contentReleases.lessonReleaseCandidates}
          publicationCandidates={contentReleases.publicationReleaseCandidates}
        />

        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "elevated",
            className: "p-6 md:p-7",
          })}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="surface" size="xs">
              {copy.synced}:{" "}
              {formatAdminNumber(
                audience.metrics.resendSyncedAudienceCount,
                language,
              )}
            </Badge>
            <Badge
              tone={
                audience.metrics.resendSyncErrorCount > 0 ? "accent" : "surface"
              }
              size="xs"
            >
              {copy.syncErrors}:{" "}
              {formatAdminNumber(
                audience.metrics.resendSyncErrorCount,
                language,
              )}
            </Badge>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-stone-950 dark:text-stone-50">
            {copy.audienceSyncTitle}
          </h3>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-400">
            {copy.audienceSyncDescription}
          </p>

          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  {copy.lessons}
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950 dark:text-stone-50">
                  {formatAdminNumber(
                    audience.metrics.lessonAudienceCount,
                    language,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  {copy.booksGeneral}
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950 dark:text-stone-50">
                  {formatAdminNumber(
                    audience.metrics.bookAudienceCount +
                      audience.metrics.generalAudienceCount,
                    language,
                  )}
                </p>
              </div>
            </div>

            <SyncAudienceContactsForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminSystemHealthSummary({
  language,
  overview,
  notifications,
}: {
  language: Language;
  overview: AdminWorkspaceOverview;
  notifications: AdminDashboardData["notifications"];
}) {
  const copy = adminDashboardSectionsCopy[language].systemHealth;
  const queuedNotificationCount = notifications.items.filter(
    (event) => event.status === "queued",
  ).length;

  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-gradient-to-br from-stone-50 via-white to-sky-50/30 p-6 shadow-lg shadow-stone-200/40 dark:border-stone-800 dark:from-stone-950 dark:via-stone-950 dark:to-sky-950/10 dark:shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Badge tone="surface" size="xs" caps>
            {copy.badge}
          </Badge>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              {overview.failedNotificationCount > 0
                ? `${formatAdminNumber(
                    overview.failedNotificationCount,
                    language,
                  )} ${
                    overview.failedNotificationCount === 1
                      ? copy.issueSingular
                      : copy.issuePlural
                  }`
                : copy.steadyTitle}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-600 dark:text-stone-400">
              {copy.description}
            </p>
          </div>
        </div>

        <Badge
          tone={overview.failedNotificationCount > 0 ? "accent" : "surface"}
          size="sm"
        >
          {copy.failedNotifications}:{" "}
          {formatAdminNumber(overview.failedNotificationCount, language)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.failedLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(
              notifications.metrics.failedNotificationCount,
              language,
            )}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.failedDescription}
          </p>
        </div>

        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.queuedLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(queuedNotificationCount, language)}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.queuedDescription}
          </p>
        </div>

        <div
          className={surfacePanelClassName({
            rounded: "3xl",
            variant: "subtle",
            className: "p-4",
          })}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {copy.recentSentLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-stone-50">
            {formatAdminNumber(
              notifications.metrics.sentNotificationCount,
              language,
            )}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {copy.recentSentDescription}
          </p>
        </div>
      </div>
    </section>
  );
}

export function AdminSubmissionsSection({
  language,
  submissions,
}: {
  language: Language;
  submissions: AdminDashboardData["submissions"];
}) {
  const copy = adminDashboardSectionsCopy[language].submissions;
  const pendingCount = countPendingSubmissions(submissions.items);

  return (
    <AdminPersistentSection
      id="admin-submissions"
      title={copy.title}
      description={copy.description}
      summary={buildSectionSummary({
        active: pendingCount,
        labels: copy.summaryLabels,
        language,
        total: submissions.items.length,
      })}
      headerBadges={
        <>
          <Badge tone={pendingCount > 0 ? "accent" : "surface"} size="xs">
            {copy.needsReview}: {formatAdminNumber(pendingCount, language)}
          </Badge>
          <Badge tone="surface" size="xs">
            {copy.reviewed}:{" "}
            {formatAdminNumber(
              submissions.items.filter(
                (submission) => submission.status === "reviewed",
              ).length,
              language,
            )}
          </Badge>
        </>
      }
      defaultOpen
    >
      {submissions.error ? (
        <AdminDatabaseErrorState message={copy.dbError} />
      ) : (
        <AdminSubmissionsList submissions={submissions.items} />
      )}
    </AdminPersistentSection>
  );
}

export function AdminRagKnowledgeSection({ language }: { language: Language }) {
  const copy = adminDashboardSectionsCopy[language].rag;

  return (
    <AdminPersistentSection
      id="admin-rag-knowledge"
      title={copy.title}
      description={copy.description}
      summary={copy.summary}
      headerBadges={
        <>
          <Badge tone="coptic" size="xs">
            {copy.embeddings}: {copy.selectable}
          </Badge>
          <Badge tone="surface" size="xs">
            {copy.destination}: coptic_documents
          </Badge>
        </>
      }
      defaultOpen
    >
      <AdminRagIngestionForm />
    </AdminPersistentSection>
  );
}

export function AdminAudienceSection({
  audience,
  language,
  showSyncForm = true,
}: {
  audience: AdminDashboardData["audience"];
  language: Language;
  showSyncForm?: boolean;
}) {
  const copy = adminDashboardSectionsCopy[language].audience;
  const { metrics } = audience;
  const defaultOpen =
    Boolean(audience.error) || metrics.resendSyncErrorCount > 0;
  const {
    overflow: overflowAudienceContacts,
    visible: visibleAudienceContacts,
  } = splitAdminVisibleItems(audience.items);
  const audienceContent = (() => {
    if (audience.error) {
      return <AdminDatabaseErrorState message={copy.dbError} />;
    }

    if (audience.items.length === 0) {
      return (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      );
    }

    return (
      <div className="space-y-6">
        {showSyncForm ? <SyncAudienceContactsForm /> : null}

        {visibleAudienceContacts.map((contact) => (
          <AdminAudienceContactCard key={contact.id} contact={contact} />
        ))}

        {overflowAudienceContacts.length > 0 ? (
          <AdminOverflowDisclosure
            count={overflowAudienceContacts.length}
            label={copy.overflowLabel}
            pluralLabel={copy.overflowPluralLabel}
          >
            {overflowAudienceContacts.map((contact) => (
              <AdminAudienceContactCard key={contact.id} contact={contact} />
            ))}
          </AdminOverflowDisclosure>
        ) : null}
      </div>
    );
  })();

  return (
    <AdminPersistentSection
      id="admin-audience"
      title={copy.title}
      description={copy.description}
      summary={
        metrics.totalAudienceContactsCount === 0
          ? copy.noSummary
          : `${formatAdminNumber(
              metrics.subscribedAudienceContactsCount,
              language,
            )} ${copy.reachable} · ${formatAdminNumber(
              metrics.totalAudienceContactsCount,
              language,
            )} ${copy.summaryTotal}`
      }
      headerBadges={
        <>
          <Badge tone="surface" size="xs">
            {copy.synced}:{" "}
            {formatAdminNumber(metrics.resendSyncedAudienceCount, language)}
          </Badge>
          <Badge
            tone={metrics.resendSyncErrorCount > 0 ? "accent" : "surface"}
            size="xs"
          >
            {copy.syncErrors}:{" "}
            {formatAdminNumber(metrics.resendSyncErrorCount, language)}
          </Badge>
          <Badge tone="coptic" size="xs">
            {copy.lessons}:{" "}
            {formatAdminNumber(metrics.lessonAudienceCount, language)}
          </Badge>
        </>
      }
      defaultOpen={defaultOpen}
    >
      {audienceContent}
    </AdminPersistentSection>
  );
}

export function AdminReleasesSection({
  contentReleases,
  language,
  showComposer = true,
}: {
  contentReleases: AdminDashboardData["contentReleases"];
  language: Language;
  showComposer?: boolean;
}) {
  const copy = adminDashboardSectionsCopy[language].releases;
  const actionableCount = countActionableContentReleases(contentReleases.items);
  const queuedCount = contentReleases.items.filter(
    (release) => release.status === "queued" || release.status === "sending",
  ).length;
  const releasesContent = (() => {
    if (contentReleases.error) {
      return <AdminDatabaseErrorState message={copy.dbError} />;
    }

    if (contentReleases.items.length === 0) {
      return (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      );
    }

    return <AdminContentReleasesList releases={contentReleases.items} />;
  })();

  return (
    <AdminPersistentSection
      id="admin-releases"
      title={copy.title}
      description={copy.description}
      summary={
        contentReleases.items.length === 0
          ? copy.noSummary
          : `${formatAdminNumber(actionableCount, language)} ${copy.active} · ${formatAdminNumber(
              contentReleases.items.length,
              language,
            )} ${copy.recentWindow}`
      }
      headerBadges={
        <>
          <Badge tone={actionableCount > 0 ? "coptic" : "surface"} size="xs">
            {copy.readyOrLive}: {formatAdminNumber(actionableCount, language)}
          </Badge>
          <Badge tone="surface" size="xs">
            {copy.inQueue}: {formatAdminNumber(queuedCount, language)}
          </Badge>
          <Badge tone="surface" size="xs">
            {copy.candidates}:{" "}
            {formatAdminNumber(
              contentReleases.lessonReleaseCandidates.length +
                contentReleases.publicationReleaseCandidates.length,
              language,
            )}
          </Badge>
        </>
      }
      defaultOpen={Boolean(contentReleases.error) || actionableCount > 0}
    >
      <div className="space-y-6">
        {showComposer ? (
          <CreateContentReleaseForm
            lessonCandidates={contentReleases.lessonReleaseCandidates}
            publicationCandidates={contentReleases.publicationReleaseCandidates}
          />
        ) : null}

        {releasesContent}
      </div>
    </AdminPersistentSection>
  );
}

export function AdminContactInboxSection({
  contactMessages,
  language,
}: {
  contactMessages: AdminDashboardData["contactMessages"];
  language: Language;
}) {
  const copy = adminDashboardSectionsCopy[language].contactInbox;
  const openMessageCount = countOpenContactMessages(contactMessages.items);
  const contactMessagesContent = (() => {
    if (contactMessages.error) {
      return <AdminDatabaseErrorState message={copy.dbError} />;
    }

    if (contactMessages.items.length === 0) {
      return (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      );
    }

    return <AdminContactMessagesList messages={contactMessages.items} />;
  })();

  return (
    <AdminPersistentSection
      id="admin-contact-inbox"
      title={copy.title}
      description={copy.description}
      summary={buildSectionSummary({
        active: openMessageCount,
        labels: copy.summaryLabels,
        language,
        total: contactMessages.items.length,
      })}
      headerBadges={
        <>
          <Badge tone={openMessageCount > 0 ? "accent" : "surface"} size="xs">
            {copy.active}: {formatAdminNumber(openMessageCount, language)}
          </Badge>
          <Badge tone="surface" size="xs">
            {copy.answered}:{" "}
            {formatAdminNumber(
              contactMessages.items.filter(
                (message) => message.status === "answered",
              ).length,
              language,
            )}
          </Badge>
        </>
      }
      defaultOpen={Boolean(contactMessages.error) || openMessageCount > 0}
    >
      {contactMessagesContent}
    </AdminPersistentSection>
  );
}

export function AdminNotificationsSection({
  language,
  notifications,
}: {
  language: Language;
  notifications: AdminDashboardData["notifications"];
}) {
  const copy = adminDashboardSectionsCopy[language].notifications;
  const { metrics } = notifications;
  const attentionNotifications = notifications.items.filter(
    (event) => event.status === "failed" || event.status === "queued",
  );
  const historyNotifications = notifications.items.filter(
    (event) => event.status === "sent",
  );
  const defaultOpen =
    Boolean(notifications.error) || metrics.failedNotificationCount > 0;
  const {
    overflow: overflowAttentionNotifications,
    visible: visibleAttentionNotifications,
  } = splitAdminVisibleItems(attentionNotifications);
  const {
    overflow: overflowHistoryNotifications,
    visible: visibleHistoryNotifications,
  } = splitAdminVisibleItems(historyNotifications);
  const notificationsContent = (() => {
    if (notifications.error) {
      return <AdminDatabaseErrorState message={copy.dbError} />;
    }

    if (notifications.items.length === 0) {
      return (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={attentionNotifications.length > 0 ? "accent" : "surface"}
              size="xs"
            >
              {copy.attentionLabel}:{" "}
              {formatAdminNumber(attentionNotifications.length, language)}
            </Badge>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {copy.attentionDescription}
            </p>
          </div>

          {attentionNotifications.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 px-5 py-4 text-sm leading-7 text-stone-600 dark:border-stone-800 dark:bg-stone-950/40 dark:text-stone-400">
              {copy.emptyIssues}
            </div>
          ) : (
            <>
              {visibleAttentionNotifications.map((event) => (
                <AdminNotificationEventCard key={event.id} event={event} />
              ))}

              {overflowAttentionNotifications.length > 0 ? (
                <AdminOverflowDisclosure
                  count={overflowAttentionNotifications.length}
                  label={copy.notificationOverflowLabel}
                  pluralLabel={copy.notificationOverflowPluralLabel}
                >
                  {overflowAttentionNotifications.map((event) => (
                    <AdminNotificationEventCard key={event.id} event={event} />
                  ))}
                </AdminOverflowDisclosure>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="surface" size="xs">
              {copy.historyLabel}:{" "}
              {formatAdminNumber(historyNotifications.length, language)}
            </Badge>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {copy.historyDescription}
            </p>
          </div>

          {historyNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200/80 bg-stone-50/60 px-5 py-4 text-sm leading-7 text-stone-500 dark:border-stone-800 dark:bg-stone-950/25 dark:text-stone-400">
              {copy.emptyHistory}
            </div>
          ) : (
            <>
              {visibleHistoryNotifications.map((event) => (
                <AdminNotificationEventCard key={event.id} event={event} />
              ))}

              {overflowHistoryNotifications.length > 0 ? (
                <AdminOverflowDisclosure
                  count={overflowHistoryNotifications.length}
                  label={copy.historyOverflowLabel}
                  pluralLabel={copy.historyOverflowPluralLabel}
                >
                  {overflowHistoryNotifications.map((event) => (
                    <AdminNotificationEventCard key={event.id} event={event} />
                  ))}
                </AdminOverflowDisclosure>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  })();

  return (
    <AdminPersistentSection
      id="admin-notifications"
      title={copy.title}
      description={copy.description}
      summary={
        metrics.recentNotificationCount === 0
          ? copy.noSummary
          : `${formatAdminNumber(metrics.failedNotificationCount, language)} ${copy.failed.toLowerCase()} · ${formatAdminNumber(
              metrics.sentNotificationCount,
              language,
            )} ${copy.sentInRecentLog}`
      }
      headerBadges={
        <>
          <Badge
            tone={metrics.failedNotificationCount > 0 ? "accent" : "surface"}
            size="xs"
          >
            {copy.failed}:{" "}
            {formatAdminNumber(metrics.failedNotificationCount, language)}
          </Badge>
          <Badge tone="coptic" size="xs">
            {copy.recentSent}:{" "}
            {formatAdminNumber(metrics.sentNotificationCount, language)}
          </Badge>
        </>
      }
      defaultOpen={defaultOpen}
    >
      {notificationsContent}
    </AdminPersistentSection>
  );
}

export function AdminEntryReportsSection({
  entryReports,
  language,
}: {
  entryReports: AdminDashboardData["entryReports"];
  language: Language;
}) {
  const copy = adminDashboardSectionsCopy[language].entryReports;
  const openReportCount = countOpenEntryReports(
    entryReports.items.map((item) => item.report),
  );
  const entryReportsContent = (() => {
    if (entryReports.error) {
      return <AdminDatabaseErrorState message={copy.dbError} />;
    }

    if (entryReports.items.length === 0) {
      return (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      );
    }

    return <AdminEntryReportsList reports={entryReports.items} />;
  })();

  return (
    <AdminPersistentSection
      id="admin-entry-reports"
      title={copy.title}
      description={copy.description}
      summary={buildSectionSummary({
        active: openReportCount,
        labels: copy.summaryLabels,
        language,
        total: entryReports.items.length,
      })}
      headerBadges={
        <>
          <Badge tone={openReportCount > 0 ? "accent" : "surface"} size="xs">
            {copy.open}: {formatAdminNumber(openReportCount, language)}
          </Badge>
          <Badge tone="surface" size="xs">
            {copy.resolved}:{" "}
            {formatAdminNumber(
              entryReports.items.filter(
                (item) => item.report.status === "resolved",
              ).length,
              language,
            )}
          </Badge>
        </>
      }
      defaultOpen={Boolean(entryReports.error) || openReportCount > 0}
    >
      {entryReportsContent}
    </AdminPersistentSection>
  );
}
