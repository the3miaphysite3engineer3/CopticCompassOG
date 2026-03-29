import { AdminContactMessageCard } from '@/features/contact/components/AdminContactMessageCard'
import { AdminContentReleaseCard } from '@/features/communications/components/AdminContentReleaseCard'
import { AdminAudienceContactCard } from '@/features/communications/components/AdminAudienceContactCard'
import { CreateContentReleaseForm } from '@/features/communications/components/CreateContentReleaseForm'
import { SyncAudienceContactsForm } from '@/features/communications/components/SyncAudienceContactsForm'
import { hasAudienceSubscriptions } from '@/features/communications/lib/communications'
import { listContentReleaseCandidates } from '@/features/communications/lib/releaseCandidates'
import { requireAdminPageSession } from '@/lib/supabase/auth'
import {
  getAdminAudienceContacts,
  getAdminContactMessages,
  getAdminContentReleases,
  getAdminEntryReports,
  getAdminNotificationEvents,
  getAdminSubmissions,
} from '@/lib/supabase/queries'
import { PageHeader } from '@/components/PageHeader'
import { PageShell, pageShellAccents } from '@/components/PageShell'
import { EmptyState } from '@/components/EmptyState'
import { EntryReportReviewCard } from '@/features/dictionary/components/EntryReportReviewCard'
import { getDictionaryEntryById } from '@/features/dictionary/lib/dictionary'
import { SubmissionCard } from '@/features/submissions/components/SubmissionCard'
import { SubmissionEmptyState } from '@/features/submissions/components/SubmissionEmptyState'
import { SubmissionReviewForm } from '@/features/submissions/components/SubmissionReviewForm'
import { SubmissionStatusBadge } from '@/features/submissions/components/SubmissionStatusBadge'
import { AdminNotificationEventCard } from '@/features/notifications/components/AdminNotificationEventCard'
import { Badge } from '@/components/Badge'

export async function AdminDashboardPage({
  redirectTo = '/admin',
}: {
  redirectTo?: string
}) {
  const { supabase } = await requireAdminPageSession(redirectTo)

  const [
    { data: submissions, error: submissionsError },
    { data: contactMessages, error: contactMessagesError },
    { data: audienceContacts, error: audienceContactsError },
    { data: contentReleases, error: contentReleasesError },
    { data: entryReports, error: entryReportsError },
    { data: notificationEvents, error: notificationEventsError },
  ] = await Promise.all([
    getAdminSubmissions(supabase),
    getAdminContactMessages(supabase),
    getAdminAudienceContacts(supabase),
    getAdminContentReleases(supabase),
    getAdminEntryReports(supabase),
    getAdminNotificationEvents(supabase),
  ])
  const resolvedSubmissions = submissions ?? []
  const resolvedContactMessages = contactMessages ?? []
  const resolvedContentReleases = contentReleases ?? []
  const resolvedNotificationEvents = notificationEvents ?? []
  const resolvedEntryReports =
    entryReports?.map((report) => ({
      entry: getDictionaryEntryById(report.entry_id),
      report,
    })) ?? []
  const recentNotificationCount = resolvedNotificationEvents.length
  const failedNotificationCount = resolvedNotificationEvents.filter(
    (event) => event.status === 'failed',
  ).length
  const sentNotificationCount = resolvedNotificationEvents.filter(
    (event) => event.status === 'sent',
  ).length
  const resolvedAudienceContacts = audienceContacts ?? []
  const subscribedAudienceContacts = resolvedAudienceContacts.filter((contact) =>
    hasAudienceSubscriptions(contact),
  )
  const lessonAudienceCount = resolvedAudienceContacts.filter(
    (contact) => contact.lessons_opt_in,
  ).length
  const bookAudienceCount = resolvedAudienceContacts.filter(
    (contact) => contact.books_opt_in,
  ).length
  const generalAudienceCount = resolvedAudienceContacts.filter(
    (contact) => contact.general_updates_opt_in,
  ).length
  const resendSyncedAudienceCount = resolvedAudienceContacts.filter((contact) =>
    Boolean(contact.syncState?.last_synced_at),
  ).length
  const resendSyncErrorCount = resolvedAudienceContacts.filter((contact) =>
    Boolean(contact.syncState?.last_error),
  ).length
  const releaseCandidates = listContentReleaseCandidates()
  const lessonReleaseCandidates = releaseCandidates.filter(
    (candidate) => candidate.itemType === 'lesson',
  )
  const publicationReleaseCandidates = releaseCandidates.filter(
    (candidate) => candidate.itemType === 'publication',
  )

  return (
    <PageShell
      className="min-h-screen px-6 py-16"
      contentClassName="mx-auto min-h-[80vh] max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700"
      accents={[
        pageShellAccents.heroEmeraldArc,
        pageShellAccents.topRightSkyOrbInset,
      ]}
    >
      <PageHeader
        eyebrow="Instructor Workspace"
        eyebrowVariant="badge"
        title="Instructor Terminal"
        description="Review submitted exercises, score translations, and send feedback."
        align="left"
        tone="analytics"
        size="compact"
        className="mb-12"
      />

      <div className="space-y-10">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Exercise submissions
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Review translation work, assign a score, and return feedback to students.
            </p>
          </div>

          {submissionsError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
              Database Error: Could not load submissions. Make sure you&apos;ve run the SQL setup
              script.
            </div>
          ) : (
            <>
              {resolvedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  subtitle={
                    <p className="font-medium">
                      Student: {submission.studentEmail || 'Unknown User'}
                    </p>
                  }
                  contentClassName="text-xl"
                  topRight={
                    submission.status === 'reviewed' ? (
                      <SubmissionStatusBadge
                        label="Graded"
                        tone="reviewed"
                        className="absolute right-0 top-0 rounded-none rounded-bl-2xl px-5 py-1.5"
                      />
                    ) : undefined
                  }
                >
                  {submission.status === 'pending' && (
                    <div className="mb-6">
                      <SubmissionStatusBadge label="Needs Review" tone="pending" />
                    </div>
                  )}
                  <SubmissionReviewForm submission={submission} />
                </SubmissionCard>
              ))}
              {resolvedSubmissions.length === 0 && (
                <SubmissionEmptyState
                  title="No active submissions."
                  description="Your inbox is clear. Waiting for students to complete exercises."
                />
              )}
            </>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Audience communication
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Track who has opted into release emails before you start sending lesson or publication announcements.
            </p>
          </div>

          {audienceContactsError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
              Database Error: Could not load audience contacts. Make sure you&apos;ve run the latest SQL setup
              script.
            </div>
          ) : resolvedAudienceContacts.length === 0 ? (
            <EmptyState
              title="No audience contacts yet."
              description="Opt-ins from the contact form, signup flow, and dashboard preferences will appear here."
            />
          ) : (
            <>
              <SyncAudienceContactsForm />

              <div className="flex flex-wrap gap-3">
                <Badge tone="surface" size="sm">
                  Total contacts: {resolvedAudienceContacts.length}
                </Badge>
                <Badge tone="accent" size="sm">
                  Reachable now: {subscribedAudienceContacts.length}
                </Badge>
                <Badge tone="surface" size="sm">
                  Resend synced: {resendSyncedAudienceCount}
                </Badge>
                <Badge tone={resendSyncErrorCount > 0 ? 'neutral' : 'surface'} size="sm">
                  Sync errors: {resendSyncErrorCount}
                </Badge>
                <Badge tone="coptic" size="sm">
                  Lessons: {lessonAudienceCount}
                </Badge>
                <Badge tone="coptic" size="sm">
                  Books: {bookAudienceCount}
                </Badge>
                <Badge tone="coptic" size="sm">
                  General: {generalAudienceCount}
                </Badge>
              </div>

              {resolvedAudienceContacts.map((contact) => (
                <AdminAudienceContactCard key={contact.id} contact={contact} />
              ))}
            </>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Release drafts
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Build snapshot-based announcement drafts for published lessons and publications before wiring up actual sending.
            </p>
          </div>

          <CreateContentReleaseForm
            lessonCandidates={lessonReleaseCandidates}
            publicationCandidates={publicationReleaseCandidates}
          />

          {contentReleasesError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
              Database Error: Could not load content releases. Make sure you&apos;ve run the latest SQL setup
              script.
            </div>
          ) : resolvedContentReleases.length === 0 ? (
            <EmptyState
              title="No release drafts yet."
              description="Create a draft above to snapshot the published lessons or publications you want to announce."
            />
          ) : (
            resolvedContentReleases.map((release) => (
              <AdminContentReleaseCard key={release.id} release={release} />
            ))
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Contact inbox
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Triage public contact messages, keep track of replies, and note who wants future updates.
            </p>
          </div>

          {contactMessagesError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
              Database Error: Could not load contact messages. Make sure you&apos;ve run the latest SQL setup
              script.
            </div>
          ) : resolvedContactMessages.length === 0 ? (
            <EmptyState
              title="No contact messages yet."
              description="When visitors send a message from the contact page, it will appear here for follow-up."
            />
          ) : (
            resolvedContactMessages.map((message) => (
              <AdminContactMessageCard key={message.id} message={message} />
            ))
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Notification activity
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Audit recent outbound alerts, confirm what was delivered, and spot failures before they pile up.
            </p>
          </div>

          {notificationEventsError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
              Database Error: Could not load notification activity. Make sure you&apos;ve run the latest SQL setup
              script.
            </div>
          ) : resolvedNotificationEvents.length === 0 ? (
            <EmptyState
              title="No notification activity yet."
              description="Notification events will appear here once contact alerts, submission alerts, and review emails have been sent."
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                <Badge tone="surface" size="sm">
                  Recent events: {recentNotificationCount}
                </Badge>
                <Badge tone={failedNotificationCount > 0 ? 'accent' : 'coptic'} size="sm">
                  Failed: {failedNotificationCount}
                </Badge>
                <Badge tone="coptic" size="sm">
                  Sent: {sentNotificationCount}
                </Badge>
              </div>

              {resolvedNotificationEvents.map((event) => (
                <AdminNotificationEventCard key={event.id} event={event} />
              ))}
            </>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Dictionary entry reports
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Review flagged lemmas, inspect the current published meaning, and move each report through your inbox.
            </p>
          </div>

          {entryReportsError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center font-bold text-red-500 dark:border-red-900/40 dark:bg-red-950/20">
              Database Error: Could not load dictionary entry reports. Make sure you&apos;ve run the latest SQL setup
              script.
            </div>
          ) : resolvedEntryReports.length === 0 ? (
            <EmptyState
              title="No dictionary reports yet."
              description="When readers flag entries from the dictionary, they will appear here for review."
            />
          ) : (
            resolvedEntryReports.map((reportWithEntry) => (
              <EntryReportReviewCard
                key={reportWithEntry.report.id}
                reportWithEntry={reportWithEntry}
              />
            ))
          )}
        </section>
      </div>
    </PageShell>
  )
}
