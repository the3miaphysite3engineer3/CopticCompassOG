import {
  getAudienceSegmentOptInColumn,
  type AudienceContactRecord,
  type ContentReleaseDeliverySummary,
  type ContentReleaseItemRecord,
  type ContentReleaseRecord,
  type Language,
} from "../_shared/contentReleaseDelivery.ts";

export function buildSupabaseRestHeaders(serviceRoleKey: string) {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
  };
}

export async function fetchSupabaseJson<T>(options: {
  method?: "GET" | "PATCH" | "POST";
  path: string;
  preferRepresentation?: boolean;
  serviceRoleKey: string;
  supabaseUrl: string;
  body?: Record<string, unknown>;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/${options.path}`,
    {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        ...buildSupabaseRestHeaders(options.serviceRoleKey),
        ...(options.preferRepresentation
          ? { Prefer: "return=representation" }
          : {}),
      },
      method: options.method ?? "GET",
    },
  );

  if (!response.ok) {
    return {
      data: null,
      error: await response.text(),
      status: response.status,
    };
  }

  const responseText = await response.text();
  if (!responseText) {
    return {
      data: null,
      error: null,
      status: response.status,
    };
  }

  return {
    data: JSON.parse(responseText) as T,
    error: null,
    status: response.status,
  };
}

export async function fetchSupabaseCount(options: {
  path: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/${options.path}`,
    {
      headers: {
        ...buildSupabaseRestHeaders(options.serviceRoleKey),
        Prefer: "count=exact",
        Range: "0-0",
      },
      method: "GET",
    },
  );

  if (!response.ok) {
    return {
      count: null,
      error: await response.text(),
      status: response.status,
    };
  }

  const contentRange = response.headers.get("content-range");
  const total = contentRange?.split("/")[1];
  const count = total ? Number.parseInt(total, 10) : Number.NaN;

  return {
    count: Number.isFinite(count) ? count : 0,
    error: null,
    status: response.status,
  };
}

export async function loadRelease(options: {
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const result = await fetchSupabaseJson<ContentReleaseRecord[]>({
    path: `content_releases?id=eq.${encodeURIComponent(options.releaseId)}&select=*`,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (result.error) {
    console.error("Failed to load content release.", {
      error: result.error,
      releaseId: options.releaseId,
      status: result.status,
    });
    return null;
  }

  return result.data?.[0] ?? null;
}

export async function claimQueuedRelease(options: {
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const now = new Date().toISOString();
  const result = await fetchSupabaseJson<ContentReleaseRecord[]>({
    body: {
      delivery_finished_at: null,
      delivery_started_at: now,
      last_delivery_error: null,
      status: "sending",
      updated_at: now,
    },
    method: "PATCH",
    path: `content_releases?id=eq.${encodeURIComponent(options.releaseId)}&status=eq.queued&select=*`,
    preferRepresentation: true,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (result.error) {
    console.error("Failed to claim queued content release.", {
      error: result.error,
      releaseId: options.releaseId,
      status: result.status,
    });
    return null;
  }

  return result.data?.[0] ?? null;
}

export async function loadReleaseItems(options: {
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const result = await fetchSupabaseJson<ContentReleaseItemRecord[]>({
    path: `content_release_items?release_id=eq.${encodeURIComponent(options.releaseId)}&select=item_id,item_type,title_snapshot,url_snapshot&order=created_at.asc`,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (result.error) {
    console.error("Failed to load content release items.", {
      error: result.error,
      releaseId: options.releaseId,
      status: result.status,
    });
    return null;
  }

  return result.data ?? [];
}

export async function countAudienceContacts(options: {
  audienceSegment: ContentReleaseRecord["audience_segment"];
  locale?: Language;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const optInColumn = getAudienceSegmentOptInColumn(options.audienceSegment);
  const localeFilter = options.locale
    ? `&locale=eq.${encodeURIComponent(options.locale)}`
    : "";
  const result = await fetchSupabaseCount({
    path: `audience_contacts?select=id&${optInColumn}=eq.true&unsubscribed_at=is.null${localeFilter}`,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (result.error) {
    console.error("Failed to count audience contacts for content release.", {
      audienceSegment: options.audienceSegment,
      error: result.error,
      status: result.status,
    });
    return null;
  }

  return result.count ?? 0;
}

export async function loadAudienceContacts(options: {
  audienceSegment: ContentReleaseRecord["audience_segment"];
  cursor: string | null;
  limit: number;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const optInColumn = getAudienceSegmentOptInColumn(options.audienceSegment);
  const filters = [
    `select=email,full_name,locale`,
    `${optInColumn}=eq.true`,
    `unsubscribed_at=is.null`,
  ];

  if (options.cursor) {
    filters.push(`email=gt.${encodeURIComponent(options.cursor)}`);
  }

  filters.push(`order=email.asc`);
  filters.push(`limit=${options.limit}`);

  const result = await fetchSupabaseJson<AudienceContactRecord[]>({
    path: `audience_contacts?${filters.join("&")}`,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (result.error) {
    console.error("Failed to load audience contacts for content release.", {
      audienceSegment: options.audienceSegment,
      cursor: options.cursor,
      error: result.error,
      status: result.status,
    });
    return null;
  }

  return (result.data ?? []).filter(
    (contact) =>
      typeof contact.email === "string" && contact.email.trim().length > 0,
  );
}

export async function updateQueuedReleaseProgress(options: {
  cursor: string | null;
  lastDeliveryError: string | null;
  releaseId: string;
  serviceRoleKey: string;
  summary: ContentReleaseDeliverySummary;
  supabaseUrl: string;
}) {
  const now = new Date().toISOString();
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/content_releases?id=eq.${encodeURIComponent(options.releaseId)}`,
    {
      body: JSON.stringify({
        delivery_cursor: options.cursor,
        delivery_summary: options.summary,
        last_delivery_error: options.lastDeliveryError,
        status: "queued",
        updated_at: now,
      }),
      headers: buildSupabaseRestHeaders(options.serviceRoleKey),
      method: "PATCH",
    },
  );

  if (!response.ok) {
    console.error("Failed to update queued content release progress.", {
      error: await response.text(),
      releaseId: options.releaseId,
      status: response.status,
    });
  }
}

export async function finalizeRelease(options: {
  cursor: string | null;
  lastDeliveryError: string | null;
  releaseId: string;
  serviceRoleKey: string;
  status: ContentReleaseRecord["status"];
  summary: ContentReleaseDeliverySummary;
  supabaseUrl: string;
}) {
  const now = new Date().toISOString();
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/content_releases?id=eq.${encodeURIComponent(options.releaseId)}`,
    {
      body: JSON.stringify({
        delivery_cursor: options.cursor,
        delivery_finished_at: now,
        delivery_summary: options.summary,
        last_delivery_error: options.lastDeliveryError,
        sent_at: options.status === "sent" ? now : null,
        status: options.status,
        updated_at: now,
      }),
      headers: buildSupabaseRestHeaders(options.serviceRoleKey),
      method: "PATCH",
    },
  );

  if (!response.ok) {
    console.error("Failed to finalize content release delivery.", {
      error: await response.text(),
      releaseId: options.releaseId,
      status: response.status,
    });
  }
}

export async function invokeNextBatch(options: {
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/functions/v1/process-content-release`,
    {
      body: JSON.stringify({
        releaseId: options.releaseId,
      }),
      headers: {
        Authorization: `Bearer ${options.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to queue the next content release batch.", {
      error,
      releaseId: options.releaseId,
      status: response.status,
    });
    return {
      error,
      status: response.status,
      success: false as const,
    };
  }

  return {
    success: true as const,
  };
}
