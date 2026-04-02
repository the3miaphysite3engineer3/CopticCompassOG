import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";

export async function getAuthenticatedUser(supabase: AppSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
