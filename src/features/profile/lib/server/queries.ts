import type { AudiencePreferencesRow } from "@/features/communications/lib/communications";
import type { ProfileRole } from "@/features/submissions/types";
import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import type { Tables } from "@/types/supabase";

const AUDIENCE_CONTACT_PREFERENCES_SELECT =
  "id, email, locale, source, books_opt_in, general_updates_opt_in, lessons_opt_in, profile_id";

export async function getProfile(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<Tables<"profiles"> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getAudienceContactForProfile(
  supabase: AppSupabaseClient,
  userId: string,
  email?: string | null,
): Promise<AudiencePreferencesRow | null> {
  const profileLinkedResult = await supabase
    .from("audience_contacts")
    .select(AUDIENCE_CONTACT_PREFERENCES_SELECT)
    .eq("profile_id", userId)
    .maybeSingle();

  if (profileLinkedResult.error) {
    return null;
  }

  if (profileLinkedResult.data) {
    return profileLinkedResult.data;
  }

  if (!email) {
    return null;
  }

  const { data, error } = await supabase
    .from("audience_contacts")
    .select(AUDIENCE_CONTACT_PREFERENCES_SELECT)
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getProfileRole(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<ProfileRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data?.role ?? null;
}
