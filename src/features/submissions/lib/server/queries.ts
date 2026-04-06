import type {
  AdminSubmission,
  SubmissionRow,
} from "@/features/submissions/types";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

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

export async function getAdminSubmissions(
  supabase: AppSupabaseClient,
): Promise<QueryResult<AdminSubmission[]>> {
  const submissionsResult = await supabase
    .from("submissions")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (submissionsResult.error || !submissionsResult.data) {
    return {
      data: null,
      error: submissionsResult.error
        ? { message: submissionsResult.error.message }
        : { message: "Could not load submissions." },
    };
  }

  if (submissionsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const profileIds = Array.from(
    new Set(submissionsResult.data.map((submission) => submission.user_id)),
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
    data: submissionsResult.data.map((submission) => ({
      ...submission,
      studentEmail: emailsByProfileId.get(submission.user_id) ?? null,
    })),
    error: null,
  };
}
