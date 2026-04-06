"use client";

import { EmptyState } from "@/components/EmptyState";
import {
  AdminFilterBar,
  AdminFilterToggle,
  AdminOverflowDisclosure,
} from "@/features/admin/components/AdminListPrimitives";
import { splitAdminVisibleItems } from "@/features/admin/lib/listPrimitives";
import {
  AdminContactMessageDisclosure,
  AdminEntryReportDisclosure,
} from "@/features/admin/components/AdminItemDisclosures";
import { AdminSubmissionReviewWorkspace } from "@/features/admin/components/AdminSubmissionReviewWorkspace";
import { usePersistentFilterState } from "@/features/admin/lib/uiState";
import { AdminContentReleaseCard } from "@/features/communications/components/AdminContentReleaseCard";
import type { ContactMessageRow } from "@/features/contact/lib/contact";
import type { AdminContentRelease } from "@/features/communications/lib/releases";
import type { EntryReportWithEntry } from "@/features/dictionary/lib/entryActions";
import type { AdminSubmission } from "@/features/submissions/types";

export function AdminContentReleasesList({
  releases,
}: {
  releases: AdminContentRelease[];
}) {
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

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "active"}
          count={activeReleases.length}
          label="Active"
          onClick={() => setFilter("active")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={historyReleases.length}
          label="Recent"
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredReleases.length === 0 ? (
        <EmptyState
          title={
            filter === "active"
              ? "No active release drafts right now."
              : "No recent release log yet."
          }
          description={
            filter === "active"
              ? historyReleases.length > 0
                ? "Switch to Recent if you want to revisit the latest sent or cancelled releases."
                : "Your communications desk is clear for now."
              : activeReleases.length > 0
                ? "The latest finished and cancelled releases will collect here once the active desk starts moving."
                : "Recent sent and cancelled releases will appear here after you have published and delivered some announcements."
          }
        />
      ) : (
        <>
          {visible.map((release) => (
            <AdminContentReleaseCard key={release.id} release={release} />
          ))}

          {overflow.length > 0 ? (
            <AdminOverflowDisclosure
              count={overflow.length}
              label="release draft"
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

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "pending"}
          count={pendingSubmissions.length}
          label="Needs review"
          onClick={() => setFilter("pending")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={historySubmissions.length}
          label="History"
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredSubmissions.length === 0 ? (
        <EmptyState
          title={
            filter === "pending"
              ? "No submissions need review right now."
              : "No reviewed submissions yet."
          }
          description={
            filter === "pending"
              ? historySubmissions.length > 0
                ? "Switch to History if you want to revisit graded work."
                : "Your review queue is clear for now."
              : pendingSubmissions.length > 0
                ? "Graded submissions will appear here once you start clearing the queue."
                : "Reviewed work will appear here once students have submitted and you have graded a lesson."
          }
        />
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

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "active"}
          count={activeMessages.length}
          label="Active"
          onClick={() => setFilter("active")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={archivedMessages.length}
          label="History"
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredMessages.length === 0 ? (
        <EmptyState
          title={
            filter === "active"
              ? "No active conversations right now."
              : "No archived conversations yet."
          }
          description={
            filter === "active"
              ? archivedMessages.length > 0
                ? "Switch to History if you want to look back through answered or archived messages."
                : "Your contact inbox is quiet for the moment."
              : activeMessages.length > 0
                ? "Answered or archived conversations will collect here after you clear the live inbox."
                : "Past conversations will appear here once messages have been answered or archived."
          }
        />
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

  return (
    <div className="space-y-6">
      <AdminFilterBar>
        <AdminFilterToggle
          active={filter === "open"}
          count={openReports.length}
          label="Open"
          onClick={() => setFilter("open")}
        />
        <AdminFilterToggle
          active={filter === "history"}
          count={historyReports.length}
          label="History"
          onClick={() => setFilter("history")}
        />
      </AdminFilterBar>

      {filteredReports.length === 0 ? (
        <EmptyState
          title={
            filter === "open"
              ? "No open dictionary reports right now."
              : "No report history yet."
          }
          description={
            filter === "open"
              ? historyReports.length > 0
                ? "Switch to History if you want to revisit reviewed or resolved reports."
                : "Nothing in the dictionary queue needs attention right now."
              : openReports.length > 0
                ? "Resolved reports will collect here once you work through the open queue."
                : "Reviewed and resolved reports will appear here after you have handled some dictionary feedback."
          }
        />
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
