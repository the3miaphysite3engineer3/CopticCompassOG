export type Language = "en" | "nl";

export type ContentReleaseRecord = {
  audience_segment: "books" | "general" | "lessons";
  body_en: string | null;
  body_nl: string | null;
  delivery_cursor: string | null;
  delivery_summary: Record<string, unknown> | null;
  id: string;
  last_delivery_error: string | null;
  locale_mode: "en_only" | "localized" | "nl_only";
  release_type: "lesson" | "mixed" | "publication";
  status: "approved" | "cancelled" | "draft" | "queued" | "sending" | "sent";
  subject_en: string | null;
  subject_nl: string | null;
};

export type ContentReleaseItemRecord = {
  item_id: string;
  item_type: "lesson" | "publication";
  title_snapshot: string;
  url_snapshot: string;
};

export type AudienceContactRecord = {
  email: string;
  full_name: string | null;
  locale: Language | null;
};

export type ContentReleaseDeliverySummary = {
  broadcasts?: Partial<Record<Language, ContentReleaseBroadcastDelivery>>;
  eligible_recipient_count: number;
  failed_count: number;
  item_count: number;
  processed_recipient_count: number;
  remaining_recipient_count: number;
  sent_count: number;
  skipped_count: number;
};

export type ContentReleaseBroadcastDelivery = {
  id: string;
  recipient_count: number;
  segment_id: string;
  status: "sent";
  subject: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseContentReleaseInvocationPayload(payload: unknown) {
  const data = asObject(payload);
  const releaseId = asOptionalString(data?.releaseId);

  if (!releaseId) {
    return null;
  }

  return { releaseId };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAudienceSegmentOptInColumn(
  audienceSegment: ContentReleaseRecord["audience_segment"],
) {
  switch (audienceSegment) {
    case "lessons":
      return "lessons_opt_in";
    case "books":
      return "books_opt_in";
    case "general":
      return "general_updates_opt_in";
    default:
      return "general_updates_opt_in";
  }
}

export function getContentReleaseDeliveryLanguage(
  release: Pick<ContentReleaseRecord, "locale_mode">,
  preferredLocale: Language,
): Language {
  if (release.locale_mode === "en_only") {
    return "en";
  }

  if (release.locale_mode === "nl_only") {
    return "nl";
  }

  return preferredLocale === "nl" ? "nl" : "en";
}

export function getContentReleaseCopyForLocale(
  release: Pick<
    ContentReleaseRecord,
    "body_en" | "body_nl" | "locale_mode" | "subject_en" | "subject_nl"
  >,
  preferredLocale: Language,
) {
  const deliveryLanguage = getContentReleaseDeliveryLanguage(
    release,
    preferredLocale,
  );

  return {
    body: deliveryLanguage === "nl" ? release.body_nl : release.body_en,
    language: deliveryLanguage,
    subject:
      deliveryLanguage === "nl" ? release.subject_nl : release.subject_en,
  };
}

export function buildContentReleaseEmailText(options: {
  body: string;
  items: Pick<ContentReleaseItemRecord, "title_snapshot" | "url_snapshot">[];
  language: Language;
}) {
  const intro = options.body.trim();
  const itemsHeading =
    options.language === "nl" ? "In deze release:" : "In this release:";
  const itemsList = options.items
    .map((item) => `- ${item.title_snapshot}: ${item.url_snapshot}`)
    .join("\n");

  return [intro, "", itemsHeading, itemsList].join("\n");
}

export function buildContentReleaseNotificationPayload(options: {
  contact: AudienceContactRecord;
  itemCount: number;
  language: Language;
  release: Pick<
    ContentReleaseRecord,
    "audience_segment" | "locale_mode" | "release_type"
  >;
}) {
  return {
    audience_segment: options.release.audience_segment,
    item_count: options.itemCount,
    locale: options.language,
    locale_mode: options.release.locale_mode,
    recipient_name: options.contact.full_name,
    release_type: options.release.release_type,
  };
}

export function buildContentReleaseNotificationDedupeKey(options: {
  eventType: string;
  recipient: string;
  releaseId: string;
}) {
  return `${options.eventType}:${options.releaseId}:${normalizeEmail(options.recipient)}`;
}

export function getContentReleaseDeliverySummary(
  release: Pick<ContentReleaseRecord, "delivery_summary">,
): ContentReleaseDeliverySummary {
  const summary = asObject(release.delivery_summary);
  const broadcasts = getContentReleaseBroadcastDeliveries(release);

  return {
    ...(broadcasts ? { broadcasts } : {}),
    eligible_recipient_count:
      asOptionalNumber(summary?.eligible_recipient_count) ?? 0,
    failed_count: asOptionalNumber(summary?.failed_count) ?? 0,
    item_count: asOptionalNumber(summary?.item_count) ?? 0,
    processed_recipient_count:
      asOptionalNumber(summary?.processed_recipient_count) ?? 0,
    remaining_recipient_count:
      asOptionalNumber(summary?.remaining_recipient_count) ?? 0,
    sent_count: asOptionalNumber(summary?.sent_count) ?? 0,
    skipped_count: asOptionalNumber(summary?.skipped_count) ?? 0,
  };
}

export function getContentReleaseBroadcastDeliveries(
  release: Pick<ContentReleaseRecord, "delivery_summary">,
) {
  const summary = asObject(release.delivery_summary);
  const broadcasts = asObject(summary?.broadcasts);

  if (!broadcasts) {
    return null;
  }

  const parsedEntries = (["en", "nl"] as const)
    .map((language) => {
      const entry = asObject(broadcasts[language]);
      const id = asOptionalString(entry?.id);
      const segmentId = asOptionalString(entry?.segment_id);
      const subject = asOptionalString(entry?.subject);
      const recipientCount = asOptionalNumber(entry?.recipient_count);
      const status = asOptionalString(entry?.status);

      if (
        !id ||
        !segmentId ||
        !subject ||
        recipientCount === null ||
        status !== "sent"
      ) {
        return null;
      }

      return [
        language,
        {
          id,
          recipient_count: recipientCount,
          segment_id: segmentId,
          status,
          subject,
        } satisfies ContentReleaseBroadcastDelivery,
      ] as const;
    })
    .filter(
      (entry): entry is readonly [Language, ContentReleaseBroadcastDelivery] =>
        entry !== null,
    );

  if (parsedEntries.length === 0) {
    return null;
  }

  return Object.fromEntries(parsedEntries) as Partial<
    Record<Language, ContentReleaseBroadcastDelivery>
  >;
}

export function mergeContentReleaseDeliverySummary(options: {
  batch: {
    failedCount: number;
    processedCount: number;
    remainingCount: number;
    sentCount: number;
    skippedCount: number;
  };
  previous: ContentReleaseDeliverySummary;
  totalEligibleRecipients: number;
  totalItemCount: number;
}) {
  return {
    eligible_recipient_count: options.totalEligibleRecipients,
    failed_count: options.previous.failed_count + options.batch.failedCount,
    item_count: options.totalItemCount,
    processed_recipient_count:
      options.previous.processed_recipient_count + options.batch.processedCount,
    remaining_recipient_count: options.batch.remainingCount,
    sent_count: options.previous.sent_count + options.batch.sentCount,
    skipped_count: options.previous.skipped_count + options.batch.skippedCount,
  } satisfies ContentReleaseDeliverySummary;
}

function asOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
