"use server";

import { revalidatePath } from "next/cache";

import {
  isContactMessageStatus,
  type ContactMessageStatus,
} from "@/features/contact/lib/contact";
import {
  isEntryReportStatus,
  type EntryReportStatus,
} from "@/features/dictionary/lib/entryActions";
import { getFormString, isUuid, normalizeWhitespace } from "@/lib/validation";

import { getValidatedAdminContext } from "./shared";

/**
 * Applies a moderation status update to one dictionary entry report. Invalid
 * payloads are rejected quietly because this action is driven by admin forms.
 */
export async function updateEntryReportStatus(
  formData: FormData,
): Promise<void> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    console.warn(
      "Dictionary entry report review skipped because Supabase is not configured.",
    );
    return;
  }

  const { supabase, user } = adminContext;
  const reportId = normalizeWhitespace(getFormString(formData, "report_id"));
  const status = normalizeWhitespace(
    getFormString(formData, "status"),
  ) as EntryReportStatus;

  if (!isUuid(reportId) || !isEntryReportStatus(status)) {
    console.warn("Rejected invalid entry report review payload", {
      reportId,
      status,
      userId: user.id,
    });
    return;
  }

  const { error } = await supabase
    .from("entry_reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    console.error("Error updating dictionary entry report status:", error);
  }

  revalidatePath("/admin");
}

/**
 * Updates the review state of a stored contact message and records the
 * response timestamp when the message has been marked as answered.
 */
export async function updateContactMessageStatus(
  formData: FormData,
): Promise<void> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    console.warn(
      "Contact message review skipped because Supabase is not configured.",
    );
    return;
  }

  const { supabase, user } = adminContext;
  const contactMessageId = normalizeWhitespace(
    getFormString(formData, "contact_message_id"),
  );
  const status = normalizeWhitespace(
    getFormString(formData, "status"),
  ) as ContactMessageStatus;

  if (!isUuid(contactMessageId) || !isContactMessageStatus(status)) {
    console.warn("Rejected invalid contact message review payload", {
      contactMessageId,
      status,
      userId: user.id,
    });
    return;
  }

  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      responded_at: status === "answered" ? new Date().toISOString() : null,
    })
    .eq("id", contactMessageId);

  if (error) {
    console.error("Error updating contact message status:", error);
  }

  revalidatePath("/admin");
}
