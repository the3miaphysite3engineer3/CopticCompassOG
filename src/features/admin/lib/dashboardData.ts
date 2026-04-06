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
import type { AdminWorkspaceMode } from "@/features/admin/lib/workspaceMode";

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

export type AdminReviewDashboardData = Pick<
  AdminDashboardData,
  "contactMessages" | "entryReports" | "submissions"
>;

export type AdminCommunicationsDashboardData = Pick<
  AdminDashboardData,
  "audience" | "contentReleases"
>;

export type AdminSystemDashboardData = Pick<
  AdminDashboardData,
  "notifications"
>;

function withItems<T>(result: QueryResult<T[]>): LoadedDashboardSection<T[]> {
  return {
    error: result.error,
    items: result.data ?? [],
  };
}

async function getExactCount(
  label: string,
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
) {
  const result = await query;

  if (result.error) {
    console.error(`Error loading admin ${label} count:`, result.error);
    return 0;
  }

  return result.count ?? 0;
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

export async function loadAdminWorkspaceOverview(
  supabase: AppSupabaseClient,
): Promise<AdminWorkspaceOverview> {
  const [
    pendingSubmissionCount,
    openContactMessageCount,
    openEntryReportCount,
    actionableReleaseCount,
    audienceSyncErrorCount,
    failedNotificationCount,
  ] = await Promise.all([
    getExactCount(
      "pending submissions",
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .is("deleted_at", null),
    ),
    getExactCount(
      "open contact messages",
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "in_progress"]),
    ),
    getExactCount(
      "open entry reports",
      supabase
        .from("entry_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ),
    getExactCount(
      "actionable content releases",
      supabase
        .from("content_releases")
        .select("id", { count: "exact", head: true })
        .in("status", ["approved", "queued", "sending"]),
    ),
    getExactCount(
      "audience sync errors",
      supabase
        .from("audience_contact_sync_state")
        .select("audience_contact_id", { count: "exact", head: true })
        .not("last_error", "is", null),
    ),
    getExactCount(
      "failed notifications",
      supabase
        .from("notification_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
    ),
  ]);

  return {
    actionableReleaseCount,
    audienceSyncErrorCount,
    failedNotificationCount,
    openContactMessageCount,
    openEntryReportCount,
    pendingSubmissionCount,
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

export async function loadAdminReviewDashboardData(
  supabase: AppSupabaseClient,
): Promise<AdminReviewDashboardData> {
  const [submissionsResult, contactMessagesResult, entryReportsResult] =
    await Promise.all([
      getAdminSubmissions(supabase),
      getAdminContactMessages(supabase),
      getAdminEntryReports(supabase),
    ]);

  return {
    contactMessages: withItems(contactMessagesResult),
    entryReports: {
      error: entryReportsResult.error,
      items: buildEntryReportItems(
        (entryReportsResult.data ?? []).map((report) => ({
          entry: getDictionaryEntryById(report.entry_id),
          report,
        })),
      ),
    },
    submissions: withItems(submissionsResult),
  };
}

export async function loadAdminCommunicationsDashboardData(
  supabase: AppSupabaseClient,
): Promise<AdminCommunicationsDashboardData> {
  const [audienceContactsResult, contentReleasesResult] = await Promise.all([
    getAdminAudienceContacts(supabase),
    getAdminContentReleases(supabase),
  ]);

  const audience = withItems(audienceContactsResult);
  const contentReleases = withItems(contentReleasesResult);

  return {
    audience: {
      ...audience,
      metrics: buildAdminAudienceMetrics(audience.items),
    },
    contentReleases: {
      ...contentReleases,
      ...buildReleaseCandidates(),
    },
  };
}

export async function loadAdminSystemDashboardData(
  supabase: AppSupabaseClient,
): Promise<AdminSystemDashboardData> {
  const notificationEventsResult = await getAdminNotificationEvents(supabase);
  const notifications = withItems(notificationEventsResult);

  return {
    notifications: {
      ...notifications,
      metrics: buildAdminNotificationMetrics(notifications.items),
    },
  };
}

export async function loadAdminDashboardDataForMode(
  supabase: AppSupabaseClient,
  mode: AdminWorkspaceMode,
) {
  switch (mode) {
    case "communications":
      return {
        communications: await loadAdminCommunicationsDashboardData(supabase),
      } as const;
    case "system":
      return {
        system: await loadAdminSystemDashboardData(supabase),
      } as const;
    case "review":
    default:
      return {
        review: await loadAdminReviewDashboardData(supabase),
      } as const;
  }
}
