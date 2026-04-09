export type SupabaseLikeError =
  | {
      code?: string | null;
      message?: string | null;
    }
  | null
  | undefined;

/**
 * Detects the missing-table error shapes surfaced by PostgREST and Postgres so
 * optional integrations can degrade without crashing.
 */
export function isMissingSupabaseTableError(error: SupabaseLikeError) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("Could not find the table") === true ||
    error.message?.includes("relation") === true
  );
}
