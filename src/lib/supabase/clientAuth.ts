import type { Database } from "@/types/supabase";

import type { SupabaseClient, User } from "@supabase/supabase-js";

type BrowserSupabaseClient = SupabaseClient<Database>;

/**
 * Extracts a string error message from the mixed error shapes returned by
 * browser auth flows and fetch wrappers.
 */
function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
}

/**
 * Detects the refresh-token failures that should clear local browser auth
 * state instead of surfacing stale-session noise to the current page.
 */
export function isInvalidRefreshTokenError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}

/**
 * Clears the browser-local Supabase session as a best-effort recovery step
 * after a stale or missing refresh token is detected.
 */
async function clearBrowserSession(supabase: BrowserSupabaseClient) {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /**
     * Session cleanup is best-effort so stale local auth does not block the
     * current page flow.
     */
  }
}

/**
 * Loads the current browser user and clears the local session when Supabase
 * reports an invalid refresh token.
 */
export async function loadBrowserUser(
  supabase: BrowserSupabaseClient,
): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await clearBrowserSession(supabase);
      }
      return null;
    }

    return data.user ?? null;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearBrowserSession(supabase);
      return null;
    }

    throw error;
  }
}
