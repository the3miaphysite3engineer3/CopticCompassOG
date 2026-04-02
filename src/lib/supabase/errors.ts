export type SupabaseLikeError =
  | {
      code?: string | null;
      message?: string | null;
    }
  | null
  | undefined;

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
