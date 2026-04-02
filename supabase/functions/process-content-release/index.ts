import {
  buildContentReleaseEmailText,
  buildContentReleaseNotificationDedupeKey,
  buildContentReleaseNotificationPayload,
  getAudienceSegmentOptInColumn,
  getContentReleaseBroadcastDeliveries,
  getContentReleaseCopyForLocale,
  getContentReleaseDeliverySummary,
  mergeContentReleaseDeliverySummary,
  normalizeEmail,
  parseContentReleaseInvocationPayload,
  type AudienceContactRecord,
  type ContentReleaseBroadcastDelivery,
  type ContentReleaseDeliverySummary,
  type ContentReleaseItemRecord,
  type ContentReleaseRecord,
  type Language,
} from "../_shared/contentReleaseDelivery.ts";

const RELEASE_BATCH_SIZE = 25;

type BroadcastSegmentMap = {
  books: string | null;
  general: string | null;
  lessons: string | null;
};

type LocalizedBroadcastSegmentMap = {
  books: {
    en: string | null;
    nl: string | null;
  };
  general: {
    en: string | null;
    nl: string | null;
  };
  lessons: {
    en: string | null;
    nl: string | null;
  };
};

type ResendBroadcastEnv = {
  localizedSegments: LocalizedBroadcastSegmentMap;
  resendApiKey: string;
  segments: BroadcastSegmentMap;
};

type ReleaseBroadcastTarget = {
  language: Language;
  recipientCount: number;
  segmentId: string;
  subject: string;
  text: string;
};

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

declare const EdgeRuntime:
  | {
      waitUntil(promise: Promise<unknown>): void;
    }
  | undefined;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

function normalizeOptionalEnvValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getResendBroadcastEnv() {
  const resendApiKey = normalizeOptionalEnvValue(
    Deno.env.get("RESEND_API_KEY_FULL_ACCESS"),
  );
  const lessons = normalizeOptionalEnvValue(
    Deno.env.get("RESEND_LESSONS_SEGMENT_ID"),
  );
  const books = normalizeOptionalEnvValue(
    Deno.env.get("RESEND_BOOKS_SEGMENT_ID"),
  );
  const general = normalizeOptionalEnvValue(
    Deno.env.get("RESEND_GENERAL_SEGMENT_ID"),
  );

  if (!resendApiKey || !lessons || !books || !general) {
    return null;
  }

  return {
    localizedSegments: {
      books: {
        en: normalizeOptionalEnvValue(
          Deno.env.get("RESEND_BOOKS_EN_SEGMENT_ID"),
        ),
        nl: normalizeOptionalEnvValue(
          Deno.env.get("RESEND_BOOKS_NL_SEGMENT_ID"),
        ),
      },
      general: {
        en: normalizeOptionalEnvValue(
          Deno.env.get("RESEND_GENERAL_EN_SEGMENT_ID"),
        ),
        nl: normalizeOptionalEnvValue(
          Deno.env.get("RESEND_GENERAL_NL_SEGMENT_ID"),
        ),
      },
      lessons: {
        en: normalizeOptionalEnvValue(
          Deno.env.get("RESEND_LESSONS_EN_SEGMENT_ID"),
        ),
        nl: normalizeOptionalEnvValue(
          Deno.env.get("RESEND_LESSONS_NL_SEGMENT_ID"),
        ),
      },
    },
    resendApiKey,
    segments: {
      books,
      general,
      lessons,
    },
  } satisfies ResendBroadcastEnv;
}

function buildSupabaseRestHeaders(serviceRoleKey: string) {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
  };
}

async function sendResendEmail(options: {
  from: string;
  resendApiKey: string;
  subject: string;
  text: string;
  to: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: options.from,
      subject: options.subject,
      text: options.text,
      to: [options.to],
    }),
    headers: {
      Authorization: `Bearer ${options.resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (response.ok) {
    const data = (await response.json()) as { id?: string };
    return { success: true as const, id: data.id ?? null };
  }

  const errorText = await response.text();
  return {
    success: false as const,
    error: errorText || "Failed to send email via Resend.",
  };
}

async function fetchSupabaseJson<T>(options: {
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

async function fetchSupabaseCount(options: {
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

async function loadRelease(options: {
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

async function claimQueuedRelease(options: {
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

async function loadReleaseItems(options: {
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

async function countAudienceContacts(options: {
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

async function loadAudienceContacts(options: {
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

async function insertNotificationEvent(options: {
  aggregateId: string;
  aggregateType: string;
  dedupeKey: string;
  eventType: string;
  payload: Record<string, string | number | null>;
  recipient: string;
  subject: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/notification_events?select=id`,
    {
      body: JSON.stringify({
        aggregate_id: options.aggregateId,
        aggregate_type: options.aggregateType,
        channel: "email",
        dedupe_key: options.dedupeKey,
        event_type: options.eventType,
        payload: options.payload,
        recipient: options.recipient,
        subject: options.subject,
      }),
      headers: {
        ...buildSupabaseRestHeaders(options.serviceRoleKey),
        Prefer: "return=representation",
      },
      method: "POST",
    },
  );

  if (response.ok) {
    const data = (await response.json()) as Array<{ id?: string }>;
    const eventId = data[0]?.id;

    if (!eventId) {
      console.error(
        "Content release notification event insert returned no id.",
        {
          dedupeKey: options.dedupeKey,
        },
      );
      return null;
    }

    return { eventId, inserted: true as const };
  }

  const errorBody = await response.text();
  if (
    response.status === 409 &&
    (errorBody.includes("notification_events_dedupe_key_key") ||
      errorBody.includes("23505") ||
      errorBody.includes("dedupe_key"))
  ) {
    return {
      eventId: null,
      inserted: false as const,
      duplicate: true as const,
    };
  }

  console.error("Failed to insert content release notification event.", {
    error: errorBody,
    status: response.status,
  });
  return null;
}

async function insertNotificationDelivery(options: {
  error: string | null;
  eventId: string;
  providerMessageId: string | null;
  recipient: string;
  serviceRoleKey: string;
  status: "failed" | "sent";
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/notification_deliveries`,
    {
      body: JSON.stringify({
        channel: "email",
        error: options.error,
        event_id: options.eventId,
        provider_message_id: options.providerMessageId,
        recipient: options.recipient,
        status: options.status,
      }),
      headers: buildSupabaseRestHeaders(options.serviceRoleKey),
      method: "POST",
    },
  );

  if (!response.ok) {
    console.error("Failed to insert content release notification delivery.", {
      error: await response.text(),
      eventId: options.eventId,
      status: response.status,
    });
  }
}

async function updateNotificationEventStatus(options: {
  eventId: string;
  lastError: string | null;
  serviceRoleKey: string;
  status: "failed" | "sent";
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/notification_events?id=eq.${encodeURIComponent(options.eventId)}`,
    {
      body: JSON.stringify({
        last_error: options.lastError,
        processed_at: new Date().toISOString(),
        status: options.status,
      }),
      headers: buildSupabaseRestHeaders(options.serviceRoleKey),
      method: "PATCH",
    },
  );

  if (!response.ok) {
    console.error(
      "Failed to update content release notification event status.",
      {
        error: await response.text(),
        eventId: options.eventId,
        status: response.status,
      },
    );
  }
}

async function updateQueuedReleaseProgress(options: {
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

async function finalizeRelease(options: {
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

async function invokeNextBatch(options: {
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

async function createResendBroadcast(options: {
  from: string;
  resendApiKey: string;
  segmentId: string;
  subject: string;
  text: string;
  name: string;
}) {
  const response = await fetch("https://api.resend.com/broadcasts", {
    body: JSON.stringify({
      from: options.from,
      name: options.name,
      segment_id: options.segmentId,
      send: true,
      subject: options.subject,
      text: options.text,
    }),
    headers: {
      Authorization: `Bearer ${options.resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (response.ok) {
    const data = (await response.json()) as { id?: string };
    return {
      id: data.id ?? null,
      success: true as const,
    };
  }

  return {
    error: (await response.text()) || "Failed to create Resend broadcast.",
    success: false as const,
  };
}

function getBroadcastBaseSegmentId(
  audienceSegment: ContentReleaseRecord["audience_segment"],
  env: ResendBroadcastEnv,
) {
  switch (audienceSegment) {
    case "lessons":
      return env.segments.lessons;
    case "books":
      return env.segments.books;
    case "general":
      return env.segments.general;
    default:
      return null;
  }
}

function getLocalizedBroadcastSegmentId(
  audienceSegment: ContentReleaseRecord["audience_segment"],
  language: Language,
  env: ResendBroadcastEnv,
) {
  switch (audienceSegment) {
    case "lessons":
      return env.localizedSegments.lessons[language];
    case "books":
      return env.localizedSegments.books[language];
    case "general":
      return env.localizedSegments.general[language];
    default:
      return null;
  }
}

async function buildReleaseBroadcastTargets(options: {
  broadcastEnv: ResendBroadcastEnv;
  release: ContentReleaseRecord;
  releaseItems: ContentReleaseItemRecord[];
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  if (options.release.locale_mode === "localized") {
    const englishCount = await countAudienceContacts({
      audienceSegment: options.release.audience_segment,
      locale: "en",
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });
    const dutchCount = await countAudienceContacts({
      audienceSegment: options.release.audience_segment,
      locale: "nl",
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });

    if (englishCount === null || dutchCount === null) {
      return {
        error: "Could not count localized recipients for this release.",
        targets: null,
        totalEligibleRecipients: null,
        usedBroadcasts: false as const,
      };
    }

    const targets: ReleaseBroadcastTarget[] = [];
    for (const language of ["en", "nl"] as const) {
      const recipientCount = language === "en" ? englishCount : dutchCount;
      if (recipientCount === 0) {
        continue;
      }

      const segmentId = getLocalizedBroadcastSegmentId(
        options.release.audience_segment,
        language,
        options.broadcastEnv,
      );

      if (!segmentId) {
        return {
          error: null,
          targets: null,
          totalEligibleRecipients: null,
          usedBroadcasts: false as const,
        };
      }

      const copy = getContentReleaseCopyForLocale(options.release, language);
      if (!copy.subject || !copy.body) {
        return {
          error:
            "This release is missing localized copy for one or more broadcast audiences.",
          targets: [],
          totalEligibleRecipients: englishCount + dutchCount,
          usedBroadcasts: true as const,
        };
      }

      targets.push({
        language,
        recipientCount,
        segmentId,
        subject: copy.subject,
        text: buildContentReleaseEmailText({
          body: copy.body,
          items: options.releaseItems,
          language,
        }),
      });
    }

    return {
      error: null,
      targets,
      totalEligibleRecipients: englishCount + dutchCount,
      usedBroadcasts: true as const,
    };
  }

  const totalEligibleRecipients = await countAudienceContacts({
    audienceSegment: options.release.audience_segment,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (totalEligibleRecipients === null) {
    return {
      error: "Could not count subscribed recipients for this release.",
      targets: [],
      totalEligibleRecipients: null,
      usedBroadcasts: true as const,
    };
  }

  const segmentId = getBroadcastBaseSegmentId(
    options.release.audience_segment,
    options.broadcastEnv,
  );

  if (!segmentId) {
    return {
      error: null,
      targets: null,
      totalEligibleRecipients: null,
      usedBroadcasts: false as const,
    };
  }

  const language: Language =
    options.release.locale_mode === "nl_only" ? "nl" : "en";
  const copy = getContentReleaseCopyForLocale(options.release, language);
  if (!copy.subject || !copy.body) {
    return {
      error:
        "This release is missing complete copy for the selected broadcast language.",
      targets: [],
      totalEligibleRecipients,
      usedBroadcasts: true as const,
    };
  }

  return {
    error: null,
    targets: [
      {
        language,
        recipientCount: totalEligibleRecipients,
        segmentId,
        subject: copy.subject,
        text: buildContentReleaseEmailText({
          body: copy.body,
          items: options.releaseItems,
          language,
        }),
      },
    ],
    totalEligibleRecipients,
    usedBroadcasts: true as const,
  };
}

function buildBroadcastRecipientLabel(target: ReleaseBroadcastTarget) {
  return `${target.language.toUpperCase()} segment ${target.segmentId}`;
}

function getPersistedBroadcastSummary(options: {
  release: ContentReleaseRecord;
  targets: ReleaseBroadcastTarget[];
}) {
  const previousBroadcasts =
    getContentReleaseBroadcastDeliveries(options.release) ?? {};
  const broadcasts: Partial<Record<Language, ContentReleaseBroadcastDelivery>> =
    {
      ...previousBroadcasts,
    };

  for (const target of options.targets) {
    const existing = previousBroadcasts[target.language];
    if (!existing) {
      continue;
    }

    broadcasts[target.language] = existing;
  }

  return broadcasts;
}

function summarizeBroadcastDelivery(options: {
  failedRecipientCount: number;
  itemCount: number;
  targetedRecipientCount: number;
  broadcasts: Partial<Record<Language, ContentReleaseBroadcastDelivery>>;
}) {
  const sentCount = Object.values(options.broadcasts).reduce(
    (total, broadcast) => total + (broadcast?.recipient_count ?? 0),
    0,
  );

  return {
    broadcasts: options.broadcasts,
    eligible_recipient_count: options.targetedRecipientCount,
    failed_count: options.failedRecipientCount,
    item_count: options.itemCount,
    processed_recipient_count: sentCount,
    remaining_recipient_count: Math.max(
      options.targetedRecipientCount - sentCount,
      0,
    ),
    sent_count: sentCount,
    skipped_count: 0,
  } satisfies ContentReleaseDeliverySummary;
}

async function deliverReleaseByBroadcast(options: {
  broadcastEnv: ResendBroadcastEnv;
  notificationFromEmail: string;
  release: ContentReleaseRecord;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const releaseItems = await loadReleaseItems({
    releaseId: options.release.id,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (!releaseItems || releaseItems.length === 0) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError: "This release has no snapshotted items to send yet.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: {
        eligible_recipient_count: 0,
        failed_count: 0,
        item_count: 0,
        processed_recipient_count: 0,
        remaining_recipient_count: 0,
        sent_count: 0,
        skipped_count: 0,
      },
      supabaseUrl: options.supabaseUrl,
    });
    return { usedBroadcasts: true as const };
  }

  const targetPlan = await buildReleaseBroadcastTargets({
    broadcastEnv: options.broadcastEnv,
    release: options.release,
    releaseItems,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (!targetPlan.usedBroadcasts) {
    return { usedBroadcasts: false as const };
  }

  if (targetPlan.error) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError: targetPlan.error,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: getContentReleaseDeliverySummary(options.release),
      supabaseUrl: options.supabaseUrl,
    });
    return { usedBroadcasts: true as const };
  }

  const targets = targetPlan.targets ?? [];
  const totalEligibleRecipients = targetPlan.totalEligibleRecipients ?? 0;

  if (totalEligibleRecipients === 0 || targets.length === 0) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        "No subscribed recipients match this release segment yet.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: {
        eligible_recipient_count: totalEligibleRecipients,
        failed_count: 0,
        item_count: releaseItems.length,
        processed_recipient_count: 0,
        remaining_recipient_count: 0,
        sent_count: 0,
        skipped_count: 0,
      },
      supabaseUrl: options.supabaseUrl,
    });
    return { usedBroadcasts: true as const };
  }

  const broadcasts = getPersistedBroadcastSummary({
    release: options.release,
    targets,
  });
  let failedRecipientCount = 0;
  let firstFailure: string | null = null;

  for (const target of targets) {
    if (broadcasts[target.language]) {
      continue;
    }

    const recipient = buildBroadcastRecipientLabel(target);
    const notificationEvent = await insertNotificationEvent({
      aggregateId: options.release.id,
      aggregateType: "content_release",
      dedupeKey: buildContentReleaseNotificationDedupeKey({
        eventType: "content_release_broadcast_sent",
        recipient,
        releaseId: options.release.id,
      }),
      eventType: "content_release_broadcast_sent",
      payload: {
        audience_segment: options.release.audience_segment,
        item_count: releaseItems.length,
        locale: target.language,
        recipient_count: target.recipientCount,
        release_type: options.release.release_type,
        segment_id: target.segmentId,
      },
      recipient,
      serviceRoleKey: options.serviceRoleKey,
      subject: target.subject,
      supabaseUrl: options.supabaseUrl,
    });

    if (!notificationEvent?.eventId) {
      failedRecipientCount += target.recipientCount;
      firstFailure ??=
        "A notification event could not be stored for one or more broadcasts.";
      continue;
    }

    const broadcastResult = await createResendBroadcast({
      from: options.notificationFromEmail,
      name: `content-release-${options.release.id}-${target.language}`,
      resendApiKey: options.broadcastEnv.resendApiKey,
      segmentId: target.segmentId,
      subject: target.subject,
      text: target.text,
    });

    if (!broadcastResult.success || !broadcastResult.id) {
      failedRecipientCount += target.recipientCount;
      firstFailure ??= broadcastResult.success
        ? "Resend did not return a broadcast id."
        : broadcastResult.error;
      await insertNotificationDelivery({
        error: broadcastResult.success
          ? "Missing broadcast id."
          : broadcastResult.error,
        eventId: notificationEvent.eventId,
        providerMessageId: null,
        recipient,
        serviceRoleKey: options.serviceRoleKey,
        status: "failed",
        supabaseUrl: options.supabaseUrl,
      });
      await updateNotificationEventStatus({
        eventId: notificationEvent.eventId,
        lastError: broadcastResult.success
          ? "Missing broadcast id."
          : broadcastResult.error,
        serviceRoleKey: options.serviceRoleKey,
        status: "failed",
        supabaseUrl: options.supabaseUrl,
      });
      continue;
    }

    broadcasts[target.language] = {
      id: broadcastResult.id,
      recipient_count: target.recipientCount,
      segment_id: target.segmentId,
      status: "sent",
      subject: target.subject,
    };

    await insertNotificationDelivery({
      error: null,
      eventId: notificationEvent.eventId,
      providerMessageId: broadcastResult.id,
      recipient,
      serviceRoleKey: options.serviceRoleKey,
      status: "sent",
      supabaseUrl: options.supabaseUrl,
    });
    await updateNotificationEventStatus({
      eventId: notificationEvent.eventId,
      lastError: null,
      serviceRoleKey: options.serviceRoleKey,
      status: "sent",
      supabaseUrl: options.supabaseUrl,
    });
  }

  const summary = summarizeBroadcastDelivery({
    broadcasts,
    failedRecipientCount,
    itemCount: releaseItems.length,
    targetedRecipientCount: totalEligibleRecipients,
  });

  await finalizeRelease({
    cursor: null,
    lastDeliveryError: firstFailure,
    releaseId: options.release.id,
    serviceRoleKey: options.serviceRoleKey,
    status: failedRecipientCount > 0 ? "approved" : "sent",
    summary,
    supabaseUrl: options.supabaseUrl,
  });

  return { usedBroadcasts: true as const };
}

async function deliverReleaseBatch(options: {
  notificationFromEmail: string;
  release: ContentReleaseRecord;
  resendApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const broadcastEnv = getResendBroadcastEnv();
  if (broadcastEnv) {
    const broadcastResult = await deliverReleaseByBroadcast({
      broadcastEnv,
      notificationFromEmail: options.notificationFromEmail,
      release: options.release,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });

    if (broadcastResult.usedBroadcasts) {
      return;
    }
  }

  const releaseItems = await loadReleaseItems({
    releaseId: options.release.id,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (!releaseItems || releaseItems.length === 0) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError: "This release has no snapshotted items to send yet.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: {
        eligible_recipient_count: 0,
        failed_count: 0,
        item_count: 0,
        processed_recipient_count: 0,
        remaining_recipient_count: 0,
        sent_count: 0,
        skipped_count: 0,
      },
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  const totalEligibleRecipients = await countAudienceContacts({
    audienceSegment: options.release.audience_segment,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (totalEligibleRecipients === null) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        "Could not count subscribed recipients for this release.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: {
        eligible_recipient_count: 0,
        failed_count: 0,
        item_count: releaseItems.length,
        processed_recipient_count: 0,
        remaining_recipient_count: 0,
        sent_count: 0,
        skipped_count: 0,
      },
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  const previousSummary = getContentReleaseDeliverySummary(options.release);

  const audienceContacts = await loadAudienceContacts({
    audienceSegment: options.release.audience_segment,
    cursor: options.release.delivery_cursor,
    limit: RELEASE_BATCH_SIZE + 1,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (!audienceContacts) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        "Could not load subscribed recipients for this release.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: previousSummary,
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  if (totalEligibleRecipients === 0) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        "No subscribed recipients match this release segment yet.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: {
        eligible_recipient_count: 0,
        failed_count: 0,
        item_count: releaseItems.length,
        processed_recipient_count: 0,
        remaining_recipient_count: 0,
        sent_count: 0,
        skipped_count: 0,
      },
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  const hasMoreRecipients = audienceContacts.length > RELEASE_BATCH_SIZE;
  const contactsToProcess = audienceContacts.slice(0, RELEASE_BATCH_SIZE);

  if (contactsToProcess.length === 0) {
    const summary = {
      ...previousSummary,
      eligible_recipient_count: totalEligibleRecipients,
      item_count: releaseItems.length,
      remaining_recipient_count: 0,
    };

    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        previousSummary.failed_count > 0
          ? (options.release.last_delivery_error ??
            "Some release deliveries failed.")
          : null,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: previousSummary.failed_count > 0 ? "approved" : "sent",
      summary,
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let firstFailure: string | null = null;

  for (const contact of contactsToProcess) {
    const normalizedRecipient = normalizeEmail(contact.email);
    const preferredLocale: Language = contact.locale === "nl" ? "nl" : "en";
    const copy = getContentReleaseCopyForLocale(
      options.release,
      preferredLocale,
    );

    if (!copy.subject || !copy.body) {
      failedCount += 1;
      if (!firstFailure) {
        firstFailure =
          "This release is missing complete copy for one or more recipient locales.";
      }
      continue;
    }

    const notificationEvent = await insertNotificationEvent({
      aggregateId: options.release.id,
      aggregateType: "content_release",
      dedupeKey: buildContentReleaseNotificationDedupeKey({
        eventType: "content_release_sent",
        recipient: normalizedRecipient,
        releaseId: options.release.id,
      }),
      eventType: "content_release_sent",
      payload: buildContentReleaseNotificationPayload({
        contact,
        itemCount: releaseItems.length,
        language: copy.language,
        release: options.release,
      }),
      recipient: normalizedRecipient,
      serviceRoleKey: options.serviceRoleKey,
      subject: copy.subject,
      supabaseUrl: options.supabaseUrl,
    });

    if (notificationEvent?.duplicate) {
      skippedCount += 1;
      continue;
    }

    if (!notificationEvent?.eventId) {
      failedCount += 1;
      if (!firstFailure) {
        firstFailure =
          "A notification event could not be stored for one or more recipients.";
      }
      continue;
    }

    const emailResult = await sendResendEmail({
      from: options.notificationFromEmail,
      resendApiKey: options.resendApiKey,
      subject: copy.subject,
      text: buildContentReleaseEmailText({
        body: copy.body,
        items: releaseItems,
        language: copy.language,
      }),
      to: normalizedRecipient,
    });

    if (emailResult.success) {
      sentCount += 1;
      await insertNotificationDelivery({
        error: null,
        eventId: notificationEvent.eventId,
        providerMessageId: emailResult.id,
        recipient: normalizedRecipient,
        serviceRoleKey: options.serviceRoleKey,
        status: "sent",
        supabaseUrl: options.supabaseUrl,
      });
      await updateNotificationEventStatus({
        eventId: notificationEvent.eventId,
        lastError: null,
        serviceRoleKey: options.serviceRoleKey,
        status: "sent",
        supabaseUrl: options.supabaseUrl,
      });
      continue;
    }

    failedCount += 1;
    if (!firstFailure) {
      firstFailure = emailResult.error;
    }
    await insertNotificationDelivery({
      error: emailResult.error,
      eventId: notificationEvent.eventId,
      providerMessageId: null,
      recipient: normalizedRecipient,
      serviceRoleKey: options.serviceRoleKey,
      status: "failed",
      supabaseUrl: options.supabaseUrl,
    });
    await updateNotificationEventStatus({
      eventId: notificationEvent.eventId,
      lastError: emailResult.error,
      serviceRoleKey: options.serviceRoleKey,
      status: "failed",
      supabaseUrl: options.supabaseUrl,
    });
  }

  const processedCount = contactsToProcess.length;
  const mergedSummary = mergeContentReleaseDeliverySummary({
    batch: {
      failedCount,
      processedCount,
      remainingCount: Math.max(
        totalEligibleRecipients -
          (previousSummary.processed_recipient_count + processedCount),
        0,
      ),
      sentCount,
      skippedCount,
    },
    previous: previousSummary,
    totalEligibleRecipients,
    totalItemCount: releaseItems.length,
  });

  if (failedCount > 0) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        firstFailure ??
        `Sent ${sentCount}, skipped ${skippedCount}, failed ${failedCount}.`,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: mergedSummary,
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  if (hasMoreRecipients) {
    const nextCursor =
      contactsToProcess[contactsToProcess.length - 1]?.email ?? null;

    await updateQueuedReleaseProgress({
      cursor: nextCursor,
      lastDeliveryError: null,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      summary: mergedSummary,
      supabaseUrl: options.supabaseUrl,
    });

    const nextBatchResult = await invokeNextBatch({
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });

    if (!nextBatchResult.success) {
      await updateQueuedReleaseProgress({
        cursor: nextCursor,
        lastDeliveryError:
          "The next delivery batch could not be started automatically.",
        releaseId: options.release.id,
        serviceRoleKey: options.serviceRoleKey,
        summary: mergedSummary,
        supabaseUrl: options.supabaseUrl,
      });
    }
    return;
  }

  await finalizeRelease({
    cursor: null,
    lastDeliveryError: null,
    releaseId: options.release.id,
    serviceRoleKey: options.serviceRoleKey,
    status: "sent",
    summary: mergedSummary,
    supabaseUrl: options.supabaseUrl,
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey =
    Deno.env.get("RESEND_API_KEY") ??
    Deno.env.get("RESEND_API_KEY_FULL_ACCESS");
  const notificationFromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL");

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey ||
    !resendApiKey ||
    !notificationFromEmail
  ) {
    console.error("Missing one or more content release delivery secrets.");
    return jsonResponse(500, {
      error: "Content release delivery is not configured.",
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("Failed to parse content release worker payload.", error);
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const invocation = parseContentReleaseInvocationPayload(payload);
  if (!invocation) {
    return jsonResponse(400, { error: "A valid releaseId is required." });
  }

  const claimedRelease = await claimQueuedRelease({
    releaseId: invocation.releaseId,
    serviceRoleKey: supabaseServiceRoleKey,
    supabaseUrl,
  });

  if (!claimedRelease) {
    const currentRelease = await loadRelease({
      releaseId: invocation.releaseId,
      serviceRoleKey: supabaseServiceRoleKey,
      supabaseUrl,
    });

    if (!currentRelease) {
      return jsonResponse(404, { error: "Release draft not found." });
    }

    if (
      currentRelease.status === "sending" ||
      currentRelease.status === "sent"
    ) {
      return jsonResponse(202, {
        releaseId: invocation.releaseId,
        success: true,
      });
    }

    return jsonResponse(409, {
      error: "Only queued releases can be processed.",
    });
  }

  const backgroundTask = deliverReleaseBatch({
    notificationFromEmail,
    release: claimedRelease,
    resendApiKey,
    serviceRoleKey: supabaseServiceRoleKey,
    supabaseUrl,
  }).catch(async (error) => {
    console.error("Unexpected content release worker failure.", error);

    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        error instanceof Error
          ? error.message
          : "The release worker failed unexpectedly.",
      releaseId: claimedRelease.id,
      serviceRoleKey: supabaseServiceRoleKey,
      status: "approved",
      summary: getContentReleaseDeliverySummary(claimedRelease),
      supabaseUrl,
    });
  });

  if (
    typeof EdgeRuntime !== "undefined" &&
    typeof EdgeRuntime.waitUntil === "function"
  ) {
    EdgeRuntime.waitUntil(backgroundTask);
  } else {
    await backgroundTask;
  }

  return jsonResponse(202, {
    batchSize: RELEASE_BATCH_SIZE,
    queued: true,
    releaseId: claimedRelease.id,
    success: true,
  });
});
