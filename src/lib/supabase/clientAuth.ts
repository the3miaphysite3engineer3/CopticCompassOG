import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type BrowserSupabaseClient = SupabaseClient<Database>;

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

export function isInvalidRefreshTokenError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}

async function clearBrowserSession(supabase: BrowserSupabaseClient) {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Best effort only. The important part is preventing stale-session noise
    // from breaking the current page flow.
  }
}

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
