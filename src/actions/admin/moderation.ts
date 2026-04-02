"use server";

import {
  isContactMessageStatus,
  type ContactMessageStatus,
} from "@/features/contact/lib/contact";
import {
  isEntryReportStatus,
  type EntryReportStatus,
} from "@/features/dictionary/lib/entryActions";
import { revalidatePath } from "next/cache";
import { getValidatedAdminContext } from "./shared";
import { getFormString, isUuid, normalizeWhitespace } from "@/lib/validation";

export async function updateEntryReportStatus(formData: FormData) {
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

export async function updateContactMessageStatus(formData: FormData) {
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
