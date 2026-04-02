"use server";

import {
  hasResendAudienceEnv,
  syncStoredAudienceContactToResend,
} from "@/lib/communications/resend";
import { revalidateAdminPaths } from "@/lib/server/revalidation";
import { getValidatedAdminContext } from "./shared";

export type SyncAudienceContactsState = {
  message?: string;
  success: boolean;
};

export async function syncAudienceContactsWithResend(
  _prevState: SyncAudienceContactsState | null,
  _formData: FormData,
): Promise<SyncAudienceContactsState> {
  void _prevState;
  void _formData;

  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    return {
      success: false,
      message: "Audience sync is unavailable right now.",
    };
  }

  if (!hasResendAudienceEnv()) {
    return {
      success: false,
      message: "Resend audience sync is not configured yet.",
    };
  }

  const { supabase } = adminContext;
  const { data: audienceContacts, error } = await supabase
    .from("audience_contacts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading audience contacts for Resend sync:", error);
    return {
      success: false,
      message: "Could not load audience contacts for sync.",
    };
  }

  if (!audienceContacts || audienceContacts.length === 0) {
    return {
      success: true,
      message: "There are no audience contacts to sync yet.",
    };
  }

  let syncedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const contact of audienceContacts) {
    const syncResult = await syncStoredAudienceContactToResend(contact);
    if (syncResult.success) {
      if ("skipped" in syncResult && syncResult.skipped) {
        skippedCount += 1;
      } else {
        syncedCount += 1;
      }
    } else {
      failedCount += 1;
      console.error("Failed to sync audience contact with Resend", {
        audienceContactId: contact.id,
        email: contact.email,
        error: syncResult.error,
      });
    }
  }

  revalidateAdminPaths();

  if (failedCount > 0) {
    return {
      success: false,
      message: `Synced ${syncedCount}, skipped ${skippedCount}, failed ${failedCount}.`,
    };
  }

  return {
    success: true,
    message: `Synced ${syncedCount} audience contact${syncedCount === 1 ? "" : "s"}${skippedCount > 0 ? `, skipped ${skippedCount}` : ""}.`,
  };
}
