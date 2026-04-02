import {
  compareEntryReportPriority,
  type AdminEntryReport,
  type EntryFavoriteRow,
} from "@/features/dictionary/lib/entryActions";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

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

export async function getAdminEntryReports(
  supabase: AppSupabaseClient,
): Promise<QueryResult<AdminEntryReport[]>> {
  const reportsResult = await supabase
    .from("entry_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (reportsResult.error || !reportsResult.data) {
    return {
      data: null,
      error: reportsResult.error
        ? { message: reportsResult.error.message }
        : { message: "Could not load dictionary entry reports." },
    };
  }

  if (reportsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const profileIds = Array.from(
    new Set(reportsResult.data.map((report) => report.user_id)),
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
    data: reportsResult.data
      .map((report) => ({
        ...report,
        reporterEmail: profileMetadataById.get(report.user_id)?.email ?? null,
        reporterName: profileMetadataById.get(report.user_id)?.fullName ?? null,
      }))
      .sort(compareEntryReportPriority),
    error: null,
  };
}
