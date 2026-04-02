"use server";

import {
  createContentReleaseDraft as createContentReleaseDraftAction,
  sendContentRelease as sendContentReleaseAction,
  sendContentReleasePreview as sendContentReleasePreviewAction,
  updateContentReleaseStatus as updateContentReleaseStatusAction,
} from "./admin/releases";
import { syncAudienceContactsWithResend as syncAudienceContactsWithResendAction } from "./admin/audience";
import {
  updateContactMessageStatus as updateContactMessageStatusAction,
  updateEntryReportStatus as updateEntryReportStatusAction,
} from "./admin/moderation";
import { submitFeedback as submitFeedbackAction } from "./admin/submissions";
import type {
  ContentReleaseDraftState,
  SendContentReleaseState,
  SyncAudienceContactsState,
} from "./admin/states";

export async function submitFeedback(formData: FormData) {
  return submitFeedbackAction(formData);
}

export async function updateEntryReportStatus(formData: FormData) {
  return updateEntryReportStatusAction(formData);
}

export async function createContentReleaseDraft(
  prevState: ContentReleaseDraftState | null,
  formData: FormData,
): Promise<ContentReleaseDraftState> {
  return createContentReleaseDraftAction(prevState, formData);
}

export async function updateContentReleaseStatus(formData: FormData) {
  return updateContentReleaseStatusAction(formData);
}

export async function sendContentRelease(
  prevState: SendContentReleaseState | null,
  formData: FormData,
): Promise<SendContentReleaseState> {
  return sendContentReleaseAction(prevState, formData);
}

export async function sendContentReleasePreview(
  prevState: SendContentReleaseState | null,
  formData: FormData,
): Promise<SendContentReleaseState> {
  return sendContentReleasePreviewAction(prevState, formData);
}

export async function syncAudienceContactsWithResend(
  prevState: SyncAudienceContactsState | null,
  formData: FormData,
): Promise<SyncAudienceContactsState> {
  return syncAudienceContactsWithResendAction(prevState, formData);
}

export async function updateContactMessageStatus(formData: FormData) {
  return updateContactMessageStatusAction(formData);
}
