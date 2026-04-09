import {
  compareEntryReportPriority,
  type AdminEntryReport,
  type EntryFavoriteRow,
} from "@/features/dictionary/lib/entryActions";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

const ADMIN_ENTRY_REPORT_HISTORY_LIMIT = 50;

/**
 * Loads the authenticated user's dictionary favorites in reverse
 * chronological order.
 */
export async function getUserEntryFavorites(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<EntryFavoriteRow[]> {
  const { data } = await supabase
    .from("entry_favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Loads all open dictionary entry reports plus a capped recent history window,
 * enriches them with reporter metadata, and applies the admin priority sort.
 */
export async function getAdminEntryReports(
  supabase: AppSupabaseClient,
): Promise<QueryResult<AdminEntryReport[]>> {
  const [openReportsResult, historyReportsResult] = await Promise.all([
    supabase
      .from("entry_reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("entry_reports")
      .select("*")
      .in("status", ["reviewed", "resolved", "dismissed"])
      .order("created_at", { ascending: false })
      .limit(ADMIN_ENTRY_REPORT_HISTORY_LIMIT),
  ]);

  if (
    openReportsResult.error ||
    !openReportsResult.data ||
    historyReportsResult.error ||
    !historyReportsResult.data
  ) {
    let error = { message: "Could not load dictionary entry reports." };
    if (openReportsResult.error) {
      error = { message: openReportsResult.error.message };
    } else if (historyReportsResult.error) {
      error = { message: historyReportsResult.error.message };
    }

    return {
      data: null,
      error,
    };
  }

  const reports = [...openReportsResult.data, ...historyReportsResult.data];

  if (reports.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const profileIds = Array.from(
    new Set(reports.map((report) => report.user_id)),
  );

  const profilesResult = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", profileIds);

  if (profilesResult.error) {
    return {
      data: null,
      error: { message: profilesResult.error.message },
    };
  }

  const profileMetadataById = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      {
        email: profile.email,
        fullName: profile.full_name,
      },
    ]),
  );

  return {
    data: reports
      .map((report) => ({
        ...report,
        reporterEmail: profileMetadataById.get(report.user_id)?.email ?? null,
        reporterName: profileMetadataById.get(report.user_id)?.fullName ?? null,
      }))
      .sort(compareEntryReportPriority),
    error: null,
  };
}
