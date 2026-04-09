import type {
  AdminSubmission,
  SubmissionRow,
} from "@/features/submissions/types";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

const ADMIN_SUBMISSION_HISTORY_LIMIT = 50;

/**
 * Loads the current user's non-deleted submissions in reverse chronological
 * order for dashboard and lesson-history views.
 */
export async function getUserSubmissions(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<SubmissionRow[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Loads all pending submissions plus a capped recent reviewed history window,
 * then enriches the result with the submitting profile email.
 */
export async function getAdminSubmissions(
  supabase: AppSupabaseClient,
): Promise<QueryResult<AdminSubmission[]>> {
  const [pendingSubmissionsResult, historySubmissionsResult] =
    await Promise.all([
      supabase
        .from("submissions")
        .select("*")
        .is("deleted_at", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("submissions")
        .select("*")
        .is("deleted_at", null)
        .eq("status", "reviewed")
        .order("created_at", { ascending: false })
        .limit(ADMIN_SUBMISSION_HISTORY_LIMIT),
    ]);

  if (
    pendingSubmissionsResult.error ||
    !pendingSubmissionsResult.data ||
    historySubmissionsResult.error ||
    !historySubmissionsResult.data
  ) {
    let error = { message: "Could not load submissions." };
    if (pendingSubmissionsResult.error) {
      error = { message: pendingSubmissionsResult.error.message };
    } else if (historySubmissionsResult.error) {
      error = { message: historySubmissionsResult.error.message };
    }

    return {
      data: null,
      error,
    };
  }

  const submissions = [
    ...pendingSubmissionsResult.data,
    ...historySubmissionsResult.data,
  ];

  if (submissions.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const profileIds = Array.from(
    new Set(submissions.map((submission) => submission.user_id)),
  );

  const profilesResult = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", profileIds);

  if (profilesResult.error) {
    return {
      data: null,
      error: { message: profilesResult.error.message },
    };
  }

  const emailsByProfileId = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile.email]),
  );

  return {
    data: submissions.map((submission) => ({
      ...submission,
      studentEmail: emailsByProfileId.get(submission.user_id) ?? null,
    })),
    error: null,
  };
}
