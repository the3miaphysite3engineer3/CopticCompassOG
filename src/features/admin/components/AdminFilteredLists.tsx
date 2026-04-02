"use client";

import { EmptyState } from "@/components/EmptyState";
import {
  AdminContactMessageDisclosure,
  AdminEntryReportDisclosure,
  AdminSubmissionDisclosure,
} from "@/features/admin/components/AdminItemDisclosures";
import { usePersistentFilterState } from "@/features/admin/lib/uiState";
import type { ContactMessageRow } from "@/features/contact/lib/contact";
import type { EntryReportWithEntry } from "@/features/dictionary/lib/entryActions";
import type { AdminSubmission } from "@/features/submissions/types";
import { cx } from "@/lib/classes";

type FilterToggleProps = {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
};

function FilterToggle({ active, count, label, onClick }: FilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
          : "border-stone-200 bg-white/70 text-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-900/70",
      )}
    >
      {label}: {count}
    </button>
  );
}

function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function AdminSubmissionsList({
  submissions,
}: {
  submissions: AdminSubmission[];
}) {
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "pending",
  );
  const reviewedSubmissions = submissions.filter(
    (submission) => submission.status === "reviewed",
  );
  const [filter, setFilter] = usePersistentFilterState<"all" | "pending">(
    "admin-filter:submissions",
    pendingSubmissions.length > 0 ? "pending" : "all",
    ["all", "pending"],
  );
  const filteredSubmissions =
    filter === "pending" ? pendingSubmissions : submissions;

  return (
    <div className="space-y-6">
      <FilterBar>
        <FilterToggle
          active={filter === "pending"}
          count={pendingSubmissions.length}
          label="Needs review"
          onClick={() => setFilter("pending")}
        />
        <FilterToggle
          active={filter === "all"}
          count={submissions.length}
          label="All"
          onClick={() => setFilter("all")}
        />
      </FilterBar>

      {filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No submissions need review right now."
          description={
            reviewedSubmissions.length > 0
              ? "Switch to All if you want to revisit graded work."
              : "Your review queue is clear for now."
          }
        />
      ) : (
        filteredSubmissions.map((submission, index) => (
          <AdminSubmissionDisclosure
            key={submission.id}
            submission={submission}
            defaultOpen={index === 0}
          />
        ))
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
  const [filter, setFilter] = usePersistentFilterState<"active" | "all">(
    "admin-filter:contact-messages",
    activeMessages.length > 0 ? "active" : "all",
    ["active", "all"],
  );
  const filteredMessages = filter === "active" ? activeMessages : messages;

  return (
    <div className="space-y-6">
      <FilterBar>
        <FilterToggle
          active={filter === "active"}
          count={activeMessages.length}
          label="Active"
          onClick={() => setFilter("active")}
        />
        <FilterToggle
          active={filter === "all"}
          count={messages.length}
          label="All"
          onClick={() => setFilter("all")}
        />
      </FilterBar>

      {filteredMessages.length === 0 ? (
        <EmptyState
          title="No active conversations right now."
          description={
            archivedMessages.length > 0
              ? "Switch to All if you want to look back through answered or archived messages."
              : "Your contact inbox is quiet for the moment."
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
  const archivedReports = reports.filter(
    (item) => item.report.status !== "open",
  );
  const [filter, setFilter] = usePersistentFilterState<"all" | "open">(
    "admin-filter:entry-reports",
    openReports.length > 0 ? "open" : "all",
    ["all", "open"],
  );
  const filteredReports = filter === "open" ? openReports : reports;

  return (
    <div className="space-y-6">
      <FilterBar>
        <FilterToggle
          active={filter === "open"}
          count={openReports.length}
          label="Open"
          onClick={() => setFilter("open")}
        />
        <FilterToggle
          active={filter === "all"}
          count={reports.length}
          label="All"
          onClick={() => setFilter("all")}
        />
      </FilterBar>

      {filteredReports.length === 0 ? (
        <EmptyState
          title="No open dictionary reports right now."
          description={
            archivedReports.length > 0
              ? "Switch to All if you want to revisit reviewed or resolved reports."
              : "Nothing in the dictionary queue needs attention right now."
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
