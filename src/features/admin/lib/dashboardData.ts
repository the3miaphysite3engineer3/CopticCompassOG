import { getAdminContactMessages } from "@/features/contact/lib/server/queries";
import {
  hasAudienceSubscriptions,
  type AdminAudienceContactRow,
} from "@/features/communications/lib/communications";
import { listContentReleaseCandidates } from "@/features/communications/lib/releaseCandidates";
import {
  getAdminAudienceContacts,
  getAdminContentReleases,
} from "@/features/communications/lib/server/queries";
import type { ContentReleaseCandidate } from "@/features/communications/lib/releases";
import { EntryReportWithEntry } from "@/features/dictionary/lib/entryActions";
import { getDictionaryEntryById } from "@/features/dictionary/lib/dictionary";
import { getAdminEntryReports } from "@/features/dictionary/lib/server/queries";
import { getAdminNotificationEvents } from "@/features/notifications/lib/server/queries";
import type { AdminNotificationEvent } from "@/features/notifications/lib/notifications";
import { getAdminSubmissions } from "@/features/submissions/lib/server/queries";
import type { AdminSubmission } from "@/features/submissions/types";
import type { QueryResult, AppSupabaseClient } from "@/lib/supabase/queryTypes";
import type { ContactMessageRow } from "@/features/contact/lib/contact";
import type { AdminContentRelease } from "@/features/communications/lib/releases";

export type AdminAudienceMetrics = {
  bookAudienceCount: number;
  generalAudienceCount: number;
  lessonAudienceCount: number;
  resendSyncErrorCount: number;
  resendSyncedAudienceCount: number;
  subscribedAudienceContactsCount: number;
  totalAudienceContactsCount: number;
};

export type AdminNotificationMetrics = {
  failedNotificationCount: number;
  recentNotificationCount: number;
  sentNotificationCount: number;
};

export type AdminWorkspaceOverview = {
  actionableReleaseCount: number;
  audienceSyncErrorCount: number;
  failedNotificationCount: number;
  openContactMessageCount: number;
  openEntryReportCount: number;
  pendingSubmissionCount: number;
};

type LoadedDashboardSection<T> = {
  error: QueryResult<T>["error"];
  items: T;
};

export type AdminDashboardData = {
  audience: LoadedDashboardSection<AdminAudienceContactRow[]> & {
    metrics: AdminAudienceMetrics;
  };
  contactMessages: LoadedDashboardSection<ContactMessageRow[]>;
  contentReleases: LoadedDashboardSection<AdminContentRelease[]> & {
    lessonReleaseCandidates: ContentReleaseCandidate[];
    publicationReleaseCandidates: ContentReleaseCandidate[];
  };
  entryReports: LoadedDashboardSection<EntryReportWithEntry[]>;
  notifications: LoadedDashboardSection<AdminNotificationEvent[]> & {
    metrics: AdminNotificationMetrics;
  };
  submissions: LoadedDashboardSection<AdminSubmission[]>;
};

function withItems<T>(result: QueryResult<T[]>): LoadedDashboardSection<T[]> {
  return {
    error: result.error,
    items: result.data ?? [],
  };
}

export function buildAdminAudienceMetrics(
  contacts: readonly Pick<
    AdminAudienceContactRow,
    "books_opt_in" | "general_updates_opt_in" | "lessons_opt_in" | "syncState"
  >[],
): AdminAudienceMetrics {
  return {
    bookAudienceCount: contacts.filter((contact) => contact.books_opt_in)
      .length,
    generalAudienceCount: contacts.filter(
      (contact) => contact.general_updates_opt_in,
    ).length,
    lessonAudienceCount: contacts.filter((contact) => contact.lessons_opt_in)
      .length,
    resendSyncErrorCount: contacts.filter((contact) =>
      Boolean(contact.syncState?.last_error),
    ).length,
    resendSyncedAudienceCount: contacts.filter((contact) =>
      Boolean(contact.syncState?.last_synced_at),
    ).length,
    subscribedAudienceContactsCount: contacts.filter((contact) =>
      hasAudienceSubscriptions(contact),
    ).length,
    totalAudienceContactsCount: contacts.length,
  };
}

export function buildAdminNotificationMetrics(
  events: readonly Pick<AdminNotificationEvent, "status">[],
): AdminNotificationMetrics {
  return {
    failedNotificationCount: events.filter((event) => event.status === "failed")
      .length,
    recentNotificationCount: events.length,
    sentNotificationCount: events.filter((event) => event.status === "sent")
      .length,
  };
}

export function countPendingSubmissions(
  submissions: readonly Pick<AdminSubmission, "status">[],
) {
  return submissions.filter((submission) => submission.status === "pending")
    .length;
}

export function countOpenContactMessages(
  messages: readonly Pick<ContactMessageRow, "status">[],
) {
  return messages.filter(
    (message) => message.status === "new" || message.status === "in_progress",
  ).length;
}

export function countOpenEntryReports(
  reports: readonly Pick<EntryReportWithEntry["report"], "status">[],
) {
  return reports.filter((report) => report.status === "open").length;
}

export function countActionableContentReleases(
  releases: readonly Pick<AdminContentRelease, "status">[],
) {
  return releases.filter(
    (release) =>
      release.status === "approved" ||
      release.status === "queued" ||
      release.status === "sending",
  ).length;
}

export function buildAdminWorkspaceOverview(
  data: Pick<
    AdminDashboardData,
    | "audience"
    | "contactMessages"
    | "contentReleases"
    | "entryReports"
    | "notifications"
    | "submissions"
  >,
): AdminWorkspaceOverview {
  return {
    actionableReleaseCount: countActionableContentReleases(
      data.contentReleases.items,
    ),
    audienceSyncErrorCount: data.audience.metrics.resendSyncErrorCount,
    failedNotificationCount: data.notifications.metrics.failedNotificationCount,
    openContactMessageCount: countOpenContactMessages(
      data.contactMessages.items,
    ),
    openEntryReportCount: countOpenEntryReports(
      data.entryReports.items.map((item) => item.report),
    ),
    pendingSubmissionCount: countPendingSubmissions(data.submissions.items),
  };
}

function buildReleaseCandidates() {
  const releaseCandidates = listContentReleaseCandidates();

  return {
    lessonReleaseCandidates: releaseCandidates.filter(
      (candidate) => candidate.itemType === "lesson",
    ),
    publicationReleaseCandidates: releaseCandidates.filter(
      (candidate) => candidate.itemType === "publication",
    ),
  };
}

function buildEntryReportItems(
  reports: AdminDashboardData["entryReports"]["items"],
) {
  return reports;
}

export async function loadAdminDashboardData(
  supabase: AppSupabaseClient,
): Promise<AdminDashboardData> {
  const [
    submissionsResult,
    contactMessagesResult,
    audienceContactsResult,
    contentReleasesResult,
    entryReportsResult,
    notificationEventsResult,
  ] = await Promise.all([
    getAdminSubmissions(supabase),
    getAdminContactMessages(supabase),
    getAdminAudienceContacts(supabase),
    getAdminContentReleases(supabase),
    getAdminEntryReports(supabase),
    getAdminNotificationEvents(supabase),
  ]);

  const submissions = withItems(submissionsResult);
  const contactMessages = withItems(contactMessagesResult);
  const audience = withItems(audienceContactsResult);
  const contentReleases = withItems(contentReleasesResult);
  const notifications = withItems(notificationEventsResult);
  const entryReports = {
    error: entryReportsResult.error,
    items: buildEntryReportItems(
      (entryReportsResult.data ?? []).map((report) => ({
        entry: getDictionaryEntryById(report.entry_id),
        report,
      })),
    ),
  };

  return {
    audience: {
      ...audience,
      metrics: buildAdminAudienceMetrics(audience.items),
    },
    contactMessages,
    contentReleases: {
      ...contentReleases,
      ...buildReleaseCandidates(),
    },
    entryReports,
    notifications: {
      ...notifications,
      metrics: buildAdminNotificationMetrics(notifications.items),
    },
    submissions,
  };
}
