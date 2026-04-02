import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { AdminContactMessageCard } from "@/features/contact/components/AdminContactMessageCard";
import { AdminAudienceContactCard } from "@/features/communications/components/AdminAudienceContactCard";
import { AdminContentReleaseCard } from "@/features/communications/components/AdminContentReleaseCard";
import { CreateContentReleaseForm } from "@/features/communications/components/CreateContentReleaseForm";
import { SyncAudienceContactsForm } from "@/features/communications/components/SyncAudienceContactsForm";
import { EntryReportReviewCard } from "@/features/dictionary/components/EntryReportReviewCard";
import { AdminNotificationEventCard } from "@/features/notifications/components/AdminNotificationEventCard";
import { SubmissionCard } from "@/features/submissions/components/SubmissionCard";
import { SubmissionEmptyState } from "@/features/submissions/components/SubmissionEmptyState";
import { SubmissionReviewForm } from "@/features/submissions/components/SubmissionReviewForm";
import { SubmissionStatusBadge } from "@/features/submissions/components/SubmissionStatusBadge";
import type { AdminDashboardData } from "@/features/admin/lib/dashboardData";

function AdminDashboardSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400">{description}</p>
      </div>

      {children}
    </section>
  );
}

function AdminDatabaseErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
      {message}
    </div>
  );
}

export function AdminSubmissionsSection({
  submissions,
}: {
  submissions: AdminDashboardData["submissions"];
}) {
  return (
    <AdminDashboardSection
      title="Exercise submissions"
      description="Review translation work, assign a score, and return feedback to students."
    >
      {submissions.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load submissions. Make sure you've run the SQL setup script." />
      ) : (
        <>
          {submissions.items.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              subtitle={
                <p className="font-medium">
                  Student: {submission.studentEmail || "Unknown User"}
                </p>
              }
              contentClassName="text-xl"
              topRight={
                submission.status === "reviewed" ? (
                  <SubmissionStatusBadge
                    label="Graded"
                    tone="reviewed"
                    className="absolute right-0 top-0 rounded-none rounded-bl-2xl px-5 py-1.5"
                  />
                ) : undefined
              }
            >
              {submission.status === "pending" ? (
                <div className="mb-6">
                  <SubmissionStatusBadge label="Needs Review" tone="pending" />
                </div>
              ) : null}
              <SubmissionReviewForm submission={submission} />
            </SubmissionCard>
          ))}
          {submissions.items.length === 0 ? (
            <SubmissionEmptyState
              title="No active submissions."
              description="Your inbox is clear. Waiting for students to complete exercises."
            />
          ) : null}
        </>
      )}
    </AdminDashboardSection>
  );
}

export function AdminAudienceSection({
  audience,
}: {
  audience: AdminDashboardData["audience"];
}) {
  const { metrics } = audience;

  return (
    <AdminDashboardSection
      title="Audience communication"
      description="Track who has opted into release emails before you start sending lesson or publication announcements."
    >
      {audience.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load audience contacts. Make sure you've run the latest SQL setup script." />
      ) : audience.items.length === 0 ? (
        <EmptyState
          title="No audience contacts yet."
          description="Opt-ins from the contact form, signup flow, and dashboard preferences will appear here."
        />
      ) : (
        <>
          <SyncAudienceContactsForm />

          <div className="flex flex-wrap gap-3">
            <Badge tone="surface" size="sm">
              Total contacts: {metrics.totalAudienceContactsCount}
            </Badge>
            <Badge tone="accent" size="sm">
              Reachable now: {metrics.subscribedAudienceContactsCount}
            </Badge>
            <Badge tone="surface" size="sm">
              Resend synced: {metrics.resendSyncedAudienceCount}
            </Badge>
            <Badge
              tone={metrics.resendSyncErrorCount > 0 ? "neutral" : "surface"}
              size="sm"
            >
              Sync errors: {metrics.resendSyncErrorCount}
            </Badge>
            <Badge tone="coptic" size="sm">
              Lessons: {metrics.lessonAudienceCount}
            </Badge>
            <Badge tone="coptic" size="sm">
              Books: {metrics.bookAudienceCount}
            </Badge>
            <Badge tone="coptic" size="sm">
              General: {metrics.generalAudienceCount}
            </Badge>
          </div>

          {audience.items.map((contact) => (
            <AdminAudienceContactCard key={contact.id} contact={contact} />
          ))}
        </>
      )}
    </AdminDashboardSection>
  );
}

export function AdminReleasesSection({
  contentReleases,
}: {
  contentReleases: AdminDashboardData["contentReleases"];
}) {
  return (
    <AdminDashboardSection
      title="Release drafts"
      description="Build snapshot-based announcement drafts for published lessons and publications before wiring up actual sending."
    >
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
        contentReleases.items.map((release) => (
          <AdminContentReleaseCard key={release.id} release={release} />
        ))
      )}
    </AdminDashboardSection>
  );
}

export function AdminContactInboxSection({
  contactMessages,
}: {
  contactMessages: AdminDashboardData["contactMessages"];
}) {
  return (
    <AdminDashboardSection
      title="Contact inbox"
      description="Triage public contact messages, keep track of replies, and note who wants future updates."
    >
      {contactMessages.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load contact messages. Make sure you've run the latest SQL setup script." />
      ) : contactMessages.items.length === 0 ? (
        <EmptyState
          title="No contact messages yet."
          description="When visitors send a message from the contact page, it will appear here for follow-up."
        />
      ) : (
        contactMessages.items.map((message) => (
          <AdminContactMessageCard key={message.id} message={message} />
        ))
      )}
    </AdminDashboardSection>
  );
}

export function AdminNotificationsSection({
  notifications,
}: {
  notifications: AdminDashboardData["notifications"];
}) {
  const { metrics } = notifications;

  return (
    <AdminDashboardSection
      title="Notification activity"
      description="Audit recent outbound alerts, confirm what was delivered, and spot failures before they pile up."
    >
      {notifications.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load notification activity. Make sure you've run the latest SQL setup script." />
      ) : notifications.items.length === 0 ? (
        <EmptyState
          title="No notification activity yet."
          description="Notification events will appear here once contact alerts, submission alerts, and review emails have been sent."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Badge tone="surface" size="sm">
              Recent events: {metrics.recentNotificationCount}
            </Badge>
            <Badge
              tone={metrics.failedNotificationCount > 0 ? "accent" : "coptic"}
              size="sm"
            >
              Failed: {metrics.failedNotificationCount}
            </Badge>
            <Badge tone="coptic" size="sm">
              Sent: {metrics.sentNotificationCount}
            </Badge>
          </div>

          {notifications.items.map((event) => (
            <AdminNotificationEventCard key={event.id} event={event} />
          ))}
        </>
      )}
    </AdminDashboardSection>
  );
}

export function AdminEntryReportsSection({
  entryReports,
}: {
  entryReports: AdminDashboardData["entryReports"];
}) {
  return (
    <AdminDashboardSection
      title="Dictionary entry reports"
      description="Review flagged lemmas, inspect the current published meaning, and move each report through your inbox."
    >
      {entryReports.error ? (
        <AdminDatabaseErrorState message="Database Error: Could not load dictionary entry reports. Make sure you've run the latest SQL setup script." />
      ) : entryReports.items.length === 0 ? (
        <EmptyState
          title="No dictionary reports yet."
          description="When readers flag entries from the dictionary, they will appear here for review."
        />
      ) : (
        entryReports.items.map((reportWithEntry) => (
          <EntryReportReviewCard
            key={reportWithEntry.report.id}
            reportWithEntry={reportWithEntry}
          />
        ))
      )}
    </AdminDashboardSection>
  );
}
