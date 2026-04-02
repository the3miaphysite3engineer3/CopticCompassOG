import {
  compareAudienceContactPriority,
  type AdminAudienceContactRow,
} from "@/features/communications/lib/communications";
import {
  compareContentReleasePriority,
  type AdminContentRelease,
  type ContentReleaseItemRow,
} from "@/features/communications/lib/releases";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

export async function getAdminAudienceContacts(
  supabase: AppSupabaseClient,
  limit?: number,
): Promise<QueryResult<AdminAudienceContactRow[]>> {
  let audienceContactsQuery = supabase
    .from("audience_contacts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    audienceContactsQuery = audienceContactsQuery.limit(limit);
  }

  const audienceContactsResult = await audienceContactsQuery;

  if (audienceContactsResult.error || !audienceContactsResult.data) {
    return {
      data: null,
      error: audienceContactsResult.error
        ? { message: audienceContactsResult.error.message }
        : { message: "Could not load audience contacts." },
    };
  }

  if (audienceContactsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const audienceContactIds = audienceContactsResult.data.map(
    (contact) => contact.id,
  );
  const syncStatesResult = await supabase
    .from("audience_contact_sync_state")
    .select("*")
    .in("audience_contact_id", audienceContactIds);

  if (syncStatesResult.error) {
    return {
      data: null,
      error: { message: syncStatesResult.error.message },
    };
  }

  const syncStateByContactId = new Map(
    (syncStatesResult.data ?? []).map((syncState) => [
      syncState.audience_contact_id,
      syncState,
    ]),
  );

  return {
    data: audienceContactsResult.data
      .map((contact) => ({
        ...contact,
        syncState: syncStateByContactId.get(contact.id) ?? null,
      }))
      .sort(compareAudienceContactPriority),
    error: null,
  };
}

export async function getAdminContentReleases(
  supabase: AppSupabaseClient,
  limit = 12,
): Promise<QueryResult<AdminContentRelease[]>> {
  const contentReleasesResult = await supabase
    .from("content_releases")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (contentReleasesResult.error || !contentReleasesResult.data) {
    return {
      data: null,
      error: contentReleasesResult.error
        ? { message: contentReleasesResult.error.message }
        : { message: "Could not load content releases." },
    };
  }

  if (contentReleasesResult.data.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const releaseIds = contentReleasesResult.data.map((release) => release.id);
  const releaseItemsResult = await supabase
    .from("content_release_items")
    .select("*")
    .in("release_id", releaseIds)
    .order("created_at", { ascending: true });

  if (releaseItemsResult.error) {
    return {
      data: null,
      error: { message: releaseItemsResult.error.message },
    };
  }

  const itemsByReleaseId = new Map<string, ContentReleaseItemRow[]>();

  for (const item of releaseItemsResult.data ?? []) {
    const items = itemsByReleaseId.get(item.release_id) ?? [];
    items.push(item);
    itemsByReleaseId.set(item.release_id, items);
  }

  return {
    data: contentReleasesResult.data
      .map((release) => ({
        ...release,
        items: itemsByReleaseId.get(release.id) ?? [],
      }))
      .sort(compareContentReleasePriority),
    error: null,
  };
}
