import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { AdminAudienceContactCard } from "@/features/communications/components/AdminAudienceContactCard";
import { AdminContentReleaseCard } from "@/features/communications/components/AdminContentReleaseCard";
import { CreateContentReleaseForm } from "@/features/communications/components/CreateContentReleaseForm";
import { SyncAudienceContactsForm } from "@/features/communications/components/SyncAudienceContactsForm";
import { AdminNotificationEventCard } from "@/features/notifications/components/AdminNotificationEventCard";
import {
  AdminContactMessagesList,
  AdminEntryReportsList,
  AdminSubmissionsList,
} from "@/features/admin/components/AdminFilteredLists";
import { AdminPersistentSection } from "@/features/admin/components/AdminPersistentSection";
import {
  countActionableContentReleases,
  countOpenContactMessages,
  countOpenEntryReports,
  countPendingSubmissions,
  type AdminDashboardData,
  type AdminWorkspaceOverview,
} from "@/features/admin/lib/dashboardData";

const ADMIN_SECTION_VISIBLE_LIMIT = 5;

function AdminDatabaseErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
      {message}
    </div>
  );
}

function buildSectionSummary(total: number, active: number, label: string) {
  if (total === 0) {
    return `No ${label.toLowerCase()}`;
  }

  if (active <= 0) {
    return `${total} ${label.toLowerCase()}`;
  }

  return `${active} active · ${total} total`;
}

function splitVisibleItems<T>(
  items: readonly T[],
  limit = ADMIN_SECTION_VISIBLE_LIMIT,
) {
  return {
    overflow: items.slice(limit),
    visible: items.slice(0, limit),
  };
}

function formatOverflowLabel(count: number, label: string) {
  return count === 1 ? `1 more ${label}` : `${count} more ${label}s`;
}

function AdminSectionOverflow({
  children,
  count,
  label,
}: {
  children: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <details className="group rounded-3xl border border-dashed border-stone-200 bg-stone-50/70 p-4 dark:border-stone-700 dark:bg-stone-950/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-2 py-1 text-sm font-medium text-stone-600 [&::-webkit-details-marker]:hidden dark:text-stone-300">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="surface" size="xs">
            {formatOverflowLabel(count, label)}
          </Badge>
          <span className="group-open:hidden">Show the rest</span>
          <span className="hidden group-open:inline">Hide extra items</span>
        </div>

        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="mt-4 space-y-6">{children}</div>
    </details>
  );
}

export function AdminWorkspaceQuickJump({
  overview,
}: {
  overview: AdminWorkspaceOverview;
}) {
  const links = [
    {
      count: overview.pendingSubmissionCount,
      href: "#admin-submissions",
      label: "Submissions",
      tone: overview.pendingSubmissionCount > 0 ? "accent" : "surface",
    },
    {
      count: overview.openEntryReportCount,
      href: "#admin-entry-reports",
      label: "Reports",
      tone: overview.openEntryReportCount > 0 ? "accent" : "surface",
    },
    {
      count: overview.openContactMessageCount,
      href: "#admin-contact-inbox",
      label: "Inbox",
      tone: overview.openContactMessageCount > 0 ? "accent" : "surface",
    },
    {
      count: overview.actionableReleaseCount,
      href: "#admin-releases",
      label: "Releases",
      tone: overview.actionableReleaseCount > 0 ? "coptic" : "surface",
    },
    {
      count: overview.audienceSyncErrorCount,
      href: "#admin-audience",
      label: "Audience",
      tone: overview.audienceSyncErrorCount > 0 ? "accent" : "surface",
    },
    {
      count: overview.failedNotificationCount,
      href: "#admin-notifications",
      label: "Alerts",
      tone: overview.failedNotificationCount > 0 ? "accent" : "surface",
    },
  ] as const;

  return (
    <nav className="app-sticky-panel mb-8 rounded-[2rem] border border-stone-200/80 bg-white/85 p-4 shadow-lg backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/75 dark:shadow-black/20">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="flat" size="xs" caps>
          Quick Jump
        </Badge>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Scan the inbox, then jump straight into the section that needs you.
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
              {link.label}: {link.count}
            </Badge>
          </a>
        ))}
      </div>
    </nav>
  );
}

export function AdminSubmissionsSection({
  submissions,
}: {
  submissions: AdminDashboardData["submissions"];
}) {
  const pendingCount = countPendingSubmissions(submissions.items);

  return (
    <AdminPersistentSection
      id="admin-submissions"
      title="Exercise submissions"
      description="Review translation work, assign a score, and return feedback to students."
      summary={buildSectionSummary(
        submissions.items.length,
        pendingCount,
        "submissions",
      )}
      headerBadges={
        <>
          <Badge tone={pendingCount > 0 ? "accent" : "surface"} size="xs">
            Needs review: {pendingCount}
          </Badge>
          <Badge tone="surface" size="xs">
            Reviewed:{" "}
            {
              submissions.items.filter(
                (submission) => submission.status === "reviewed",
              ).length
            }
          </Badge>
        </>
      }
      defaultOpen
    >
      {submissions.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load submissions. Make sure you've run the SQL setup script." />
      ) : (
        <AdminSubmissionsList submissions={submissions.items} />
      )}
    </AdminPersistentSection>
  );
}

export function AdminAudienceSection({
  audience,
}: {
  audience: AdminDashboardData["audience"];
}) {
  const { metrics } = audience;
  const defaultOpen =
    Boolean(audience.error) || metrics.resendSyncErrorCount > 0;
  const {
    overflow: overflowAudienceContacts,
    visible: visibleAudienceContacts,
  } = splitVisibleItems(audience.items);

  return (
    <AdminPersistentSection
      id="admin-audience"
      title="Audience communication"
      description="Track who has opted into release emails before you start sending lesson or publication announcements."
      summary={
        metrics.totalAudienceContactsCount === 0
          ? "No contacts yet"
          : `${metrics.subscribedAudienceContactsCount} reachable · ${metrics.totalAudienceContactsCount} total`
      }
      headerBadges={
        <>
          <Badge tone="surface" size="xs">
            Synced: {metrics.resendSyncedAudienceCount}
          </Badge>
          <Badge
            tone={metrics.resendSyncErrorCount > 0 ? "accent" : "surface"}
            size="xs"
          >
            Sync errors: {metrics.resendSyncErrorCount}
          </Badge>
          <Badge tone="coptic" size="xs">
            Lessons: {metrics.lessonAudienceCount}
          </Badge>
        </>
      }
      defaultOpen={defaultOpen}
    >
      {audience.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load audience contacts. Make sure you've run the latest SQL setup script." />
      ) : audience.items.length === 0 ? (
        <EmptyState
          title="No audience contacts yet."
          description="Opt-ins from the contact form, signup flow, and dashboard preferences will appear here."
        />
      ) : (
        <div className="space-y-6">
          <SyncAudienceContactsForm />

          {visibleAudienceContacts.map((contact) => (
            <AdminAudienceContactCard key={contact.id} contact={contact} />
          ))}

          {overflowAudienceContacts.length > 0 ? (
            <AdminSectionOverflow
              count={overflowAudienceContacts.length}
              label="audience contact"
            >
              {overflowAudienceContacts.map((contact) => (
                <AdminAudienceContactCard key={contact.id} contact={contact} />
              ))}
            </AdminSectionOverflow>
          ) : null}
        </div>
      )}
    </AdminPersistentSection>
  );
}

export function AdminReleasesSection({
  contentReleases,
}: {
  contentReleases: AdminDashboardData["contentReleases"];
}) {
  const actionableCount = countActionableContentReleases(contentReleases.items);
  const queuedCount = contentReleases.items.filter(
    (release) => release.status === "queued" || release.status === "sending",
  ).length;
  const { overflow: overflowReleases, visible: visibleReleases } =
    splitVisibleItems(contentReleases.items);

  return (
    <AdminPersistentSection
      id="admin-releases"
      title="Release drafts"
      description="Build snapshot-based announcement drafts for published lessons and publications before wiring up actual sending."
      summary={
        contentReleases.items.length === 0
          ? "No release drafts yet"
          : `${actionableCount} active · ${contentReleases.items.length} total`
      }
      headerBadges={
        <>
          <Badge tone={actionableCount > 0 ? "coptic" : "surface"} size="xs">
            Ready or live: {actionableCount}
          </Badge>
          <Badge tone="surface" size="xs">
            In queue: {queuedCount}
          </Badge>
          <Badge tone="surface" size="xs">
            Candidates:{" "}
            {contentReleases.lessonReleaseCandidates.length +
              contentReleases.publicationReleaseCandidates.length}
          </Badge>
        </>
      }
      defaultOpen={Boolean(contentReleases.error) || actionableCount > 0}
    >
      <div className="space-y-6">
        <CreateContentReleaseForm
          lessonCandidates={contentReleases.lessonReleaseCandidates}
          publicationCandidates={contentReleases.publicationReleaseCandidates}
        />

        {contentReleases.error ? (
          <AdminDatabaseErrorState message="Database Error: Could not load content releases. Make sure you've run the latest SQL setup script." />
        ) : contentReleases.items.length === 0 ? (
          <EmptyState
            title="No release drafts yet."
            description="Create a draft above to snapshot the published lessons or publications you want to announce."
          />
        ) : (
          <>
            {visibleReleases.map((release) => (
              <AdminContentReleaseCard key={release.id} release={release} />
            ))}

            {overflowReleases.length > 0 ? (
              <AdminSectionOverflow
                count={overflowReleases.length}
                label="release draft"
              >
                {overflowReleases.map((release) => (
                  <AdminContentReleaseCard key={release.id} release={release} />
                ))}
              </AdminSectionOverflow>
            ) : null}
          </>
        )}
      </div>
    </AdminPersistentSection>
  );
}

export function AdminContactInboxSection({
  contactMessages,
}: {
  contactMessages: AdminDashboardData["contactMessages"];
}) {
  const openMessageCount = countOpenContactMessages(contactMessages.items);

  return (
    <AdminPersistentSection
      id="admin-contact-inbox"
      title="Contact inbox"
      description="Triage public contact messages, keep track of replies, and note who wants future updates."
      summary={buildSectionSummary(
        contactMessages.items.length,
        openMessageCount,
        "messages",
      )}
      headerBadges={
        <>
          <Badge tone={openMessageCount > 0 ? "accent" : "surface"} size="xs">
            Active: {openMessageCount}
          </Badge>
          <Badge tone="surface" size="xs">
            Answered:{" "}
            {
              contactMessages.items.filter(
                (message) => message.status === "answered",
              ).length
            }
          </Badge>
        </>
      }
      defaultOpen={Boolean(contactMessages.error) || openMessageCount > 0}
    >
      {contactMessages.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load contact messages. Make sure you've run the latest SQL setup script." />
      ) : contactMessages.items.length === 0 ? (
        <EmptyState
          title="No contact messages yet."
          description="When visitors send a message from the contact page, it will appear here for follow-up."
        />
      ) : (
        <AdminContactMessagesList messages={contactMessages.items} />
      )}
    </AdminPersistentSection>
  );
}

export function AdminNotificationsSection({
  notifications,
}: {
  notifications: AdminDashboardData["notifications"];
}) {
  const { metrics } = notifications;
  const defaultOpen =
    Boolean(notifications.error) || metrics.failedNotificationCount > 0;
  const { overflow: overflowNotifications, visible: visibleNotifications } =
    splitVisibleItems(notifications.items);

  return (
    <AdminPersistentSection
      id="admin-notifications"
      title="Notification activity"
      description="Audit recent outbound alerts, confirm what was delivered, and spot failures before they pile up."
      summary={
        metrics.recentNotificationCount === 0
          ? "No notification activity yet"
          : `${metrics.failedNotificationCount} failed · ${metrics.recentNotificationCount} recent`
      }
      headerBadges={
        <>
          <Badge
            tone={metrics.failedNotificationCount > 0 ? "accent" : "surface"}
            size="xs"
          >
            Failed: {metrics.failedNotificationCount}
          </Badge>
          <Badge tone="coptic" size="xs">
            Sent: {metrics.sentNotificationCount}
          </Badge>
        </>
      }
      defaultOpen={defaultOpen}
    >
      {notifications.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load notification activity. Make sure you've run the latest SQL setup script." />
      ) : notifications.items.length === 0 ? (
        <EmptyState
          title="No notification activity yet."
          description="Notification events will appear here once contact alerts, submission alerts, and review emails have been sent."
        />
      ) : (
        <div className="space-y-6">
          {visibleNotifications.map((event) => (
            <AdminNotificationEventCard key={event.id} event={event} />
          ))}

          {overflowNotifications.length > 0 ? (
            <AdminSectionOverflow
              count={overflowNotifications.length}
              label="notification"
            >
              {overflowNotifications.map((event) => (
                <AdminNotificationEventCard key={event.id} event={event} />
              ))}
            </AdminSectionOverflow>
          ) : null}
        </div>
      )}
    </AdminPersistentSection>
  );
}

export function AdminEntryReportsSection({
  entryReports,
}: {
  entryReports: AdminDashboardData["entryReports"];
}) {
  const openReportCount = countOpenEntryReports(
    entryReports.items.map((item) => item.report),
  );

  return (
    <AdminPersistentSection
      id="admin-entry-reports"
      title="Dictionary entry reports"
      description="Review flagged lemmas, inspect the current published meaning, and move each report through your inbox."
      summary={buildSectionSummary(
        entryReports.items.length,
        openReportCount,
        "reports",
      )}
      headerBadges={
        <>
          <Badge tone={openReportCount > 0 ? "accent" : "surface"} size="xs">
            Open: {openReportCount}
          </Badge>
          <Badge tone="surface" size="xs">
            Resolved:{" "}
            {
              entryReports.items.filter(
                (item) => item.report.status === "resolved",
              ).length
            }
          </Badge>
        </>
      }
      defaultOpen={Boolean(entryReports.error) || openReportCount > 0}
    >
      {entryReports.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load dictionary entry reports. Make sure you've run the latest SQL setup script." />
      ) : entryReports.items.length === 0 ? (
        <EmptyState
          title="No dictionary reports yet."
          description="When readers flag entries from the dictionary, they will appear here for review."
        />
      ) : (
        <AdminEntryReportsList reports={entryReports.items} />
      )}
    </AdminPersistentSection>
  );
}
