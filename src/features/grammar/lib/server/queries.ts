import type {
  LessonBookmarkRow,
  LessonNoteRow,
  LessonProgressRow,
  SectionProgressRow,
} from "@/features/grammar/types";
import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";

/**
 * Loads lesson-level progress rows for one user, ordered by most recently
 * viewed lesson first.
 */
export async function getUserLessonProgressRows(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<LessonProgressRow[]> {
  const { data } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false });

  return data ?? [];
}

/**
 * Loads section-level completion rows for one user, ordered by most recently
 * completed section first.
 */
export async function getUserSectionProgressRows(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<SectionProgressRow[]> {
  const { data } = await supabase
    .from("section_progress")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  return data ?? [];
}

/**
 * Loads the user's lesson bookmarks in reverse chronological order.
 */
export async function getUserLessonBookmarks(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<LessonBookmarkRow[]> {
  const { data } = await supabase
    .from("lesson_bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Loads the user's lesson notes in most recently updated order.
 */
export async function getUserLessonNotes(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<LessonNoteRow[]> {
  const { data } = await supabase
    .from("lesson_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}
