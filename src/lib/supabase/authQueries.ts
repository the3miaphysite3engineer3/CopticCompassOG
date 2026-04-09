import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";

/**
 * Loads the current authenticated user from the provided Supabase client.
 */
export async function getAuthenticatedUser(supabase: AppSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
