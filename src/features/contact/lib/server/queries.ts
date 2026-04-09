import {
  compareContactMessagePriority,
  type ContactMessageRow,
} from "@/features/contact/lib/contact";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

const ADMIN_CONTACT_MESSAGE_HISTORY_LIMIT = 50;

/**
 * Loads all active contact messages plus a capped recent history window so the
 * admin inbox stays bounded as older conversations accumulate.
 */
export async function getAdminContactMessages(
  supabase: AppSupabaseClient,
): Promise<QueryResult<ContactMessageRow[]>> {
  const [activeMessagesResult, historyMessagesResult] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("*")
      .in("status", ["new", "in_progress"])
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_messages")
      .select("*")
      .in("status", ["answered", "archived"])
      .order("created_at", { ascending: false })
      .limit(ADMIN_CONTACT_MESSAGE_HISTORY_LIMIT),
  ]);

  if (
    activeMessagesResult.error ||
    !activeMessagesResult.data ||
    historyMessagesResult.error ||
    !historyMessagesResult.data
  ) {
    let error = { message: "Could not load contact messages." };
    if (activeMessagesResult.error) {
      error = { message: activeMessagesResult.error.message };
    } else if (historyMessagesResult.error) {
      error = { message: historyMessagesResult.error.message };
    }

    return {
      data: null,
      error,
    };
  }

  return {
    data: [...activeMessagesResult.data, ...historyMessagesResult.data].sort(
      compareContactMessagePriority,
    ),
    error: null,
  };
}
