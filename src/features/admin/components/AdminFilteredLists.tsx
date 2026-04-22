"use client";

import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/components/LanguageProvider";
import {
  AdminContactMessageDisclosure,
  AdminEntryReportDisclosure,
} from "@/features/admin/components/AdminItemDisclosures";
import {
  AdminFilterBar,
  AdminFilterToggle,
  AdminOverflowDisclosure,
} from "@/features/admin/components/AdminListPrimitives";
import { AdminSubmissionReviewWorkspace } from "@/features/admin/components/AdminSubmissionReviewWorkspace";
import { splitAdminVisibleItems } from "@/features/admin/lib/listPrimitives";
import { usePersistentFilterState } from "@/features/admin/lib/uiState";
import { AdminContentReleaseCard } from "@/features/communications/components/AdminContentReleaseCard";
import type { AdminContentRelease } from "@/features/communications/lib/releases";
import type { ContactMessageRow } from "@/features/contact/lib/contact";
import type { EntryReportWithEntry } from "@/features/dictionary/lib/entryActions";
import type { AdminSubmission } from "@/features/submissions/types";

const adminFilteredListsCopy = {
  en: {
    contactMessages: {
      active: "Active",
      emptyActiveDescription: "Your contact inbox is quiet for the moment.",
      emptyActiveWithHistoryDescription:
        "Switch to Recent if you want to look back through the latest answered or archived messages.",
      emptyActiveTitle: "No active conversations right now.",
      emptyHistoryDescription:
        "Recent answered and archived conversations will appear here once messages have been resolved.",
      emptyHistoryIncomingDescription:
        "Recent answered or archived conversations will collect here after you clear the live inbox.",
      emptyHistoryTitle: "No archived conversations yet.",
      recent: "Recent",
    },
    entryReports: {
      emptyHistoryDescription:
        "Recent reviewed and resolved reports will appear here after you have handled some dictionary feedback.",
      emptyHistoryOpenDescription:
        "Recent resolved reports will collect here once you work through the open queue.",
      emptyHistoryTitle: "No report history yet.",
      emptyOpenDescription:
        "Nothing in the dictionary queue needs attention right now.",
      emptyOpenTitle: "No open dictionary reports right now.",
      emptyOpenWithHistoryDescription:
        "Switch to Recent if you want to revisit the latest reviewed or resolved reports.",
      open: "Open",
      recent: "Recent",
    },
    releases: {
      active: "Active",
      emptyActiveDescription: "Your communications desk is clear for now.",
      emptyActiveTitle: "No active release drafts right now.",
      emptyActiveWithHistoryDescription:
        "Switch to Recent if you want to revisit the latest sent or cancelled releases.",
      emptyHistoryActiveDescription:
        "The latest finished and cancelled releases will collect here once the active desk starts moving.",
      emptyHistoryDescription:
        "Recent sent and cancelled releases will appear here after you have published and delivered some announcements.",
      emptyHistoryTitle: "No recent release log yet.",
      overflowLabel: "release draft",
      overflowPluralLabel: "release drafts",
      recent: "Recent",
    },
    submissions: {
      emptyHistoryDescription:
        "Recent reviewed work will appear here once students have submitted and you have graded a lesson.",
      emptyHistoryPendingDescription:
        "Recent graded submissions will appear here once you start clearing the queue.",
      emptyHistoryTitle: "No reviewed submissions yet.",
      emptyPendingDescription: "Your review queue is clear for now.",
      emptyPendingTitle: "No submissions need review right now.",
      emptyPendingWithHistoryDescription:
        "Switch to Recent if you want to revisit the latest graded work.",
      needsReview: "Needs review",
      recent: "Recent",
    },
  },
  nl: {
    contactMessages: {
      active: "Actief",
      emptyActiveDescription: "Uw contactinbox is op dit moment rustig.",
      emptyActiveWithHistoryDescription:
        "Schakel naar Recent als u de nieuwste beantwoorde of gearchiveerde berichten wilt terugzien.",
      emptyActiveTitle: "Geen actieve gesprekken op dit moment.",
      emptyHistoryDescription:
        "Recent beantwoorde en gearchiveerde gesprekken verschijnen hier zodra berichten zijn opgelost.",
      emptyHistoryIncomingDescription:
        "Recent beantwoorde of gearchiveerde gesprekken worden hier verzameld nadat u de actieve inbox hebt afgewerkt.",
      emptyHistoryTitle: "Nog geen gearchiveerde gesprekken.",
      recent: "Recent",
    },
    entryReports: {
      emptyHistoryDescription:
        "Recent beoordeelde en opgeloste rapporten verschijnen hier nadat u woordenboekfeedback hebt verwerkt.",
      emptyHistoryOpenDescription:
        "Recent opgeloste rapporten worden hier verzameld zodra u de open wachtrij verwerkt.",
      emptyHistoryTitle: "Nog geen rapportgeschiedenis.",
      emptyOpenDescription:
        "Er staat nu niets in de woordenboekwachtrij dat aandacht vraagt.",
      emptyOpenTitle: "Geen open woordenboekrapporten op dit moment.",
      emptyOpenWithHistoryDescription:
        "Schakel naar Recent als u de nieuwste beoordeelde of opgeloste rapporten wilt terugzien.",
      open: "Open",
      recent: "Recent",
    },
    releases: {
      active: "Actief",
      emptyActiveDescription: "Uw communicatiedesk is voorlopig leeg.",
      emptyActiveTitle: "Geen actieve releaseconcepten op dit moment.",
      emptyActiveWithHistoryDescription:
        "Schakel naar Recent als u de nieuwste verzonden of geannuleerde releases wilt terugzien.",
      emptyHistoryActiveDescription:
        "De nieuwste afgeronde en geannuleerde releases worden hier verzameld zodra de actieve desk in beweging komt.",
      emptyHistoryDescription:
        "Recent verzonden en geannuleerde releases verschijnen hier nadat u aankondigingen hebt gepubliceerd en bezorgd.",
      emptyHistoryTitle: "Nog geen recent releaselog.",
      overflowLabel: "releaseconcept",
      overflowPluralLabel: "releaseconcepten",
      recent: "Recent",
    },
    submissions: {
      emptyHistoryDescription:
        "Recent beoordeeld werk verschijnt hier zodra studenten iets hebben ingediend en u een les hebt beoordeeld.",
      emptyHistoryPendingDescription:
        "Recent beoordeelde inzendingen verschijnen hier zodra u de wachtrij begint leeg te maken.",
      emptyHistoryTitle: "Nog geen beoordeelde inzendingen.",
      emptyPendingDescription: "Uw beoordelingswachtrij is voorlopig leeg.",
      emptyPendingTitle: "Geen inzendingen te beoordelen op dit moment.",
      emptyPendingWithHistoryDescription:
        "Schakel naar Recent als u het nieuwste beoordeelde werk wilt terugzien.",
      needsReview: "Te beoordelen",
      recent: "Recent",
    },
  },
} as const;

export function AdminContentReleasesList({
  releases,
}: {
  releases: AdminContentRelease[];
}) {
  const { language } = useLanguage();
  const copy = adminFilteredListsCopy[language].releases;
  const activeStatuses = new Set(["draft", "approved", "queued", "sending"]);
  const activeReleases = releases.filter((release) =>
    activeStatuses.has(release.status),
  );
  const historyReleases = releases.filter(
    (release) => !activeStatuses.has(release.status),
  );
  const [filter, setFilter] = usePersistentFilterState<"active" | "history">(
    "admin-filter:content-releases",
    activeReleases.length > 0 ? "active" : "history",
    ["active", "history"],
  );
  const filteredReleases =
    filter === "active" ? activeReleases : historyReleases;
  const { overflow, visible } = splitAdminVisibleItems(filteredReleases);
  let emptyTitle: string = copy.emptyHistoryTitle;
  let emptyDescription: string = copy.emptyHistoryDescription;

  if (filter === "active") {
    emptyTitle = copy.emptyActiveTitle;
    emptyDescription =
      historyReleases.length > 0
        ? copy.emptyActiveWithHistoryDescription
        : copy.emptyActiveDescription;
  } else if (activeReleases.length > 0) {
    emptyDescription = copy.emptyHistoryActiveDescription;
  }

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "active"}
          count={activeReleases.length}
          label={copy.active}
          onClick={() => setFilter("active")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={historyReleases.length}
          label={copy.recent}
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredReleases.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {visible.map((release) => (
            <AdminContentReleaseCard key={release.id} release={release} />
          ))}

          {overflow.length > 0 ? (
            <AdminOverflowDisclosure
              count={overflow.length}
              label={copy.overflowLabel}
              pluralLabel={copy.overflowPluralLabel}
            >
              {overflow.map((release) => (
                <AdminContentReleaseCard key={release.id} release={release} />
              ))}
            </AdminOverflowDisclosure>
          ) : null}
        </>
      )}
    </div>
  );
}

export function AdminSubmissionsList({
  submissions,
}: {
  submissions: AdminSubmission[];
}) {
  const { language } = useLanguage();
  const copy = adminFilteredListsCopy[language].submissions;
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "pending",
  );
  const historySubmissions = submissions.filter(
    (submission) => submission.status === "reviewed",
  );
  const [filter, setFilter] = usePersistentFilterState<"history" | "pending">(
    "admin-filter:submissions",
    pendingSubmissions.length > 0 ? "pending" : "history",
    ["history", "pending"],
  );
  const filteredSubmissions =
    filter === "pending" ? pendingSubmissions : historySubmissions;
  let emptyTitle: string = copy.emptyHistoryTitle;
  let emptyDescription: string = copy.emptyHistoryDescription;

  if (filter === "pending") {
    emptyTitle = copy.emptyPendingTitle;
    emptyDescription =
      historySubmissions.length > 0
        ? copy.emptyPendingWithHistoryDescription
        : copy.emptyPendingDescription;
  } else if (pendingSubmissions.length > 0) {
    emptyDescription = copy.emptyHistoryPendingDescription;
  }

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "pending"}
          count={pendingSubmissions.length}
          label={copy.needsReview}
          onClick={() => setFilter("pending")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={historySubmissions.length}
          label={copy.recent}
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredSubmissions.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <AdminSubmissionReviewWorkspace submissions={filteredSubmissions} />
      )}
    </div>
  );
}

export function AdminContactMessagesList({
  messages,
}: {
  messages: ContactMessageRow[];
}) {
  const { language } = useLanguage();
  const copy = adminFilteredListsCopy[language].contactMessages;
  const activeMessages = messages.filter(
    (message) => message.status === "new" || message.status === "in_progress",
  );
  const archivedMessages = messages.filter(
    (message) => message.status === "answered" || message.status === "archived",
  );
  const [filter, setFilter] = usePersistentFilterState<"active" | "history">(
    "admin-filter:contact-messages",
    activeMessages.length > 0 ? "active" : "history",
    ["active", "history"],
  );
  const filteredMessages =
    filter === "active" ? activeMessages : archivedMessages;
  let emptyTitle: string = copy.emptyHistoryTitle;
  let emptyDescription: string = copy.emptyHistoryDescription;

  if (filter === "active") {
    emptyTitle = copy.emptyActiveTitle;
    emptyDescription =
      archivedMessages.length > 0
        ? copy.emptyActiveWithHistoryDescription
        : copy.emptyActiveDescription;
  } else if (activeMessages.length > 0) {
    emptyDescription = copy.emptyHistoryIncomingDescription;
  }

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "active"}
          count={activeMessages.length}
          label={copy.active}
          onClick={() => setFilter("active")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={archivedMessages.length}
          label={copy.recent}
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredMessages.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        filteredMessages.map((message, index) => (
          <AdminContactMessageDisclosure
            key={message.id}
            message={message}
            defaultOpen={index === 0}
          />
        ))
      )}
    </div>
  );
}

export function AdminEntryReportsList({
  reports,
}: {
  reports: EntryReportWithEntry[];
}) {
  const { language } = useLanguage();
  const copy = adminFilteredListsCopy[language].entryReports;
  const openReports = reports.filter((item) => item.report.status === "open");
  const historyReports = reports.filter(
    (item) => item.report.status !== "open",
  );
  const [filter, setFilter] = usePersistentFilterState<"history" | "open">(
    "admin-filter:entry-reports",
    openReports.length > 0 ? "open" : "history",
    ["history", "open"],
  );
  const filteredReports = filter === "open" ? openReports : historyReports;
  let emptyTitle: string = copy.emptyHistoryTitle;
  let emptyDescription: string = copy.emptyHistoryDescription;

  if (filter === "open") {
    emptyTitle = copy.emptyOpenTitle;
    emptyDescription =
      historyReports.length > 0
        ? copy.emptyOpenWithHistoryDescription
        : copy.emptyOpenDescription;
  } else if (openReports.length > 0) {
    emptyDescription = copy.emptyHistoryOpenDescription;
  }

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "open"}
          count={openReports.length}
          label={copy.open}
          onClick={() => setFilter("open")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={historyReports.length}
          label={copy.recent}
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredReports.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        filteredReports.map((reportWithEntry, index) => (
          <AdminEntryReportDisclosure
            key={reportWithEntry.report.id}
            reportWithEntry={reportWithEntry}
            defaultOpen={index === 0}
          />
        ))
      )}
    </div>
  );
}
