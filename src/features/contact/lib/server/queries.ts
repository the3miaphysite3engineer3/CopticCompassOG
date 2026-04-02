import {
  compareContactMessagePriority,
  type ContactMessageRow,
} from "@/features/contact/lib/contact";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

export async function getAdminContactMessages(
  supabase: AppSupabaseClient,
): Promise<QueryResult<ContactMessageRow[]>> {
  const contactMessagesResult = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (contactMessagesResult.error || !contactMessagesResult.data) {
    return {
      data: null,
      error: contactMessagesResult.error
        ? { message: contactMessagesResult.error.message }
        : { message: "Could not load contact messages." },
    };
  }

  return {
    data: [...contactMessagesResult.data].sort(compareContactMessagePriority),
    error: null,
  };
}
