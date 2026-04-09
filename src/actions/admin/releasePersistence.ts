import type {
  ContentReleaseCandidate,
  ContentReleaseItemRow,
  ContentReleaseRow,
} from "@/features/communications/lib/releases";
import type { QueryResult } from "@/lib/supabase/queryTypes";

import type { AdminSupabase } from "./shared";

type ResolvedReleaseItem = Pick<
  ContentReleaseCandidate,
  "itemId" | "itemType" | "title" | "url"
>;
type ContentReleaseDeliveryContext = {
  items: ContentReleaseItemRow[];
  release: ContentReleaseRow;
};
type ContentReleaseIdRecord = Pick<ContentReleaseRow, "id">;
type ContentReleaseStatusRecord = Pick<ContentReleaseRow, "id" | "status">;
type ContentReleaseMutationResult = QueryResult<null>;

/**
 * Loads the release row plus its snapshotted items so delivery, preview, and
 * deletion actions all operate on the same persisted draft payload.
 */
export async function loadContentReleaseForDelivery(
  releaseId: string,
  supabase: AdminSupabase,
): Promise<ContentReleaseDeliveryContext | null> {
  const { data: release, error: releaseError } = await supabase
    .from("content_releases")
    .select("*")
    .eq("id", releaseId)
    .maybeSingle();

  if (releaseError || !release) {
    console.error(
      "Error loading content release draft for delivery:",
      releaseError,
    );
    return null;
  }

  const { data: releaseItems, error: releaseItemsError } = await supabase
    .from("content_release_items")
    .select("*")
    .eq("release_id", releaseId)
    .order("created_at", { ascending: true });

  if (releaseItemsError || !releaseItems || releaseItems.length === 0) {
    console.error(
      "Error loading content release items for delivery:",
      releaseItemsError,
    );
    return null;
  }

  return {
    items: releaseItems,
    release,
  };
}

/**
 * Creates the parent release row that stores the reviewed copy and delivery
 * metadata used by later preview and background-send actions.
 */
export async function createContentReleaseRecord(options: {
  audienceSegment: ContentReleaseRow["audience_segment"];
  bodyEn: string | null;
  bodyNl: string | null;
  localeMode: ContentReleaseRow["locale_mode"];
  releaseType: ContentReleaseRow["release_type"];
  subjectEn: string | null;
  subjectNl: string | null;
  supabase: AdminSupabase;
}): Promise<QueryResult<ContentReleaseIdRecord>> {
  const timestamp = new Date().toISOString();

  return options.supabase
    .from("content_releases")
    .insert({
      audience_segment: options.audienceSegment,
      body_en: options.bodyEn,
      body_nl: options.bodyNl,
      locale_mode: options.localeMode,
      release_type: options.releaseType,
      subject_en: options.subjectEn,
      subject_nl: options.subjectNl,
      updated_at: timestamp,
    })
    .select("id")
    .single();
}

/**
 * Stores immutable snapshots of the items attached to a release so delivery is
 * not affected by later title or URL changes in the source content.
 */
export async function createContentReleaseItemSnapshots(options: {
  releaseId: string;
  resolvedItems: ResolvedReleaseItem[];
  supabase: AdminSupabase;
}): Promise<ContentReleaseMutationResult> {
  return options.supabase.from("content_release_items").insert(
    options.resolvedItems.map((item) => ({
      item_id: item.itemId,
      item_type: item.itemType,
      release_id: options.releaseId,
      title_snapshot: item.title,
      url_snapshot: item.url,
    })),
  );
}

/**
 * Updates the review status on an editable release and clears any previous
 * sent timestamp because the draft may still change before delivery.
 */
export async function updateContentReleaseStatusRecord(options: {
  releaseId: string;
  status: ContentReleaseRow["status"];
  supabase: AdminSupabase;
}): Promise<ContentReleaseMutationResult> {
  return options.supabase
    .from("content_releases")
    .update({
      sent_at: null,
      status: options.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", options.releaseId);
}

/**
 * Loads the minimal release fields needed by deletion and review actions that
 * only care about identity plus current workflow status.
 */
export async function loadContentReleaseStatusRecord(options: {
  releaseId: string;
  supabase: AdminSupabase;
}): Promise<QueryResult<ContentReleaseStatusRecord>> {
  return options.supabase
    .from("content_releases")
    .select("id, status")
    .eq("id", options.releaseId)
    .maybeSingle();
}

/**
 * Deletes the release row and returns its id when the current database policy
 * allows the admin action to proceed.
 */
export async function deleteContentReleaseRecord(options: {
  releaseId: string;
  supabase: AdminSupabase;
}): Promise<QueryResult<ContentReleaseIdRecord>> {
  return options.supabase
    .from("content_releases")
    .delete()
    .eq("id", options.releaseId)
    .select("id")
    .maybeSingle();
}

/**
 * Transitions a reviewed release into the queued state and resets delivery
 * cursors so the background worker can start from a clean batch boundary.
 */
export async function queueContentReleaseDeliveryRecord(options: {
  itemCount: number;
  release: Pick<ContentReleaseRow, "delivery_summary">;
  releaseId: string;
  requestedBy: string;
  supabase: AdminSupabase;
}): Promise<ContentReleaseMutationResult> {
  const now = new Date().toISOString();

  return options.supabase
    .from("content_releases")
    .update({
      delivery_cursor: null,
      delivery_finished_at: null,
      delivery_requested_at: now,
      delivery_requested_by: options.requestedBy,
      delivery_started_at: null,
      delivery_summary: options.release.delivery_summary ?? {
        item_count: options.itemCount,
      },
      last_delivery_error: null,
      sent_at: null,
      status: "queued",
      updated_at: now,
    })
    .eq("id", options.releaseId);
}

/**
 * Restores the release status after the background worker could not be started,
 * preserving queued releases as queued while returning newly queued drafts to
 * the approved state.
 */
export async function revertQueuedContentReleaseRecord(options: {
  isResumingQueuedRelease: boolean;
  releaseId: string;
  supabase: AdminSupabase;
}): Promise<ContentReleaseMutationResult> {
  const revertTimestamp = new Date().toISOString();

  return options.supabase
    .from("content_releases")
    .update({
      last_delivery_error:
        "The background delivery worker could not be started.",
      status: options.isResumingQueuedRelease ? "queued" : "approved",
      updated_at: revertTimestamp,
    })
    .eq("id", options.releaseId);
}
