import type {
  ContentReleaseCandidate,
  ContentReleaseItemRow,
  ContentReleaseRow,
} from "@/features/communications/lib/releases";
import type { AdminSupabase } from "./shared";

type ResolvedReleaseItem = Pick<
  ContentReleaseCandidate,
  "itemId" | "itemType" | "title" | "url"
>;

export async function loadContentReleaseForDelivery(
  releaseId: string,
  supabase: AdminSupabase,
) {
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
  } satisfies {
    items: ContentReleaseItemRow[];
    release: ContentReleaseRow;
  };
}

export async function createContentReleaseRecord(options: {
  audienceSegment: ContentReleaseRow["audience_segment"];
  bodyEn: string | null;
  bodyNl: string | null;
  localeMode: ContentReleaseRow["locale_mode"];
  releaseType: ContentReleaseRow["release_type"];
  subjectEn: string | null;
  subjectNl: string | null;
  supabase: AdminSupabase;
}) {
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

export async function createContentReleaseItemSnapshots(options: {
  releaseId: string;
  resolvedItems: ResolvedReleaseItem[];
  supabase: AdminSupabase;
}) {
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

export async function updateContentReleaseStatusRecord(options: {
  releaseId: string;
  status: ContentReleaseRow["status"];
  supabase: AdminSupabase;
}) {
  return options.supabase
    .from("content_releases")
    .update({
      sent_at: null,
      status: options.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", options.releaseId);
}

export async function loadContentReleaseStatusRecord(options: {
  releaseId: string;
  supabase: AdminSupabase;
}) {
  return options.supabase
    .from("content_releases")
    .select("id, status")
    .eq("id", options.releaseId)
    .maybeSingle();
}

export async function deleteContentReleaseRecord(options: {
  releaseId: string;
  supabase: AdminSupabase;
}) {
  return options.supabase
    .from("content_releases")
    .delete()
    .eq("id", options.releaseId)
    .select("id")
    .maybeSingle();
}

export async function queueContentReleaseDeliveryRecord(options: {
  itemCount: number;
  release: Pick<ContentReleaseRow, "delivery_summary">;
  releaseId: string;
  requestedBy: string;
  supabase: AdminSupabase;
}) {
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

export async function revertQueuedContentReleaseRecord(options: {
  isResumingQueuedRelease: boolean;
  releaseId: string;
  supabase: AdminSupabase;
}) {
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
