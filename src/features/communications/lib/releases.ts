import type { Language } from "@/types/i18n";
import type { Json, Tables } from "@/types/supabase";

export type ContentReleaseRow = Tables<"content_releases">;
export type ContentReleaseItemRow = Tables<"content_release_items">;

export type ContentReleaseCandidate = {
  id: string;
  itemId: string;
  itemType: ContentReleaseItemRow["item_type"];
  summaryEn?: string;
  summaryNl?: string;
  title: string;
  url: string;
};

export type AdminContentRelease = ContentReleaseRow & {
  items: ContentReleaseItemRow[];
};

export type ContentReleaseDeliverySummary = {
  broadcasts?: Array<{
    id: string;
    language: Language;
    recipientCount: number;
    segmentId: string;
    subject: string;
  }>;
  eligibleRecipientCount?: number;
  failedCount?: number;
  processedRecipientCount?: number;
  remainingRecipientCount?: number;
  sentCount?: number;
  skippedCount?: number;
};

export const CONTENT_RELEASE_AUDIENCE_SEGMENTS = [
  "lessons",
  "books",
  "general",
] as const satisfies readonly ContentReleaseRow["audience_segment"][];

export const CONTENT_RELEASE_LOCALE_MODES = [
  "localized",
  "en_only",
  "nl_only",
] as const satisfies readonly ContentReleaseRow["locale_mode"][];

export const CONTENT_RELEASE_EDITABLE_STATUSES = [
  "draft",
  "approved",
  "cancelled",
] as const satisfies readonly ContentReleaseRow["status"][];

export function deriveContentReleaseType(
  itemTypes: ContentReleaseItemRow["item_type"][],
): ContentReleaseRow["release_type"] | null {
  const uniqueItemTypes = Array.from(new Set(itemTypes));

  if (uniqueItemTypes.length === 0) {
    return null;
  }

  if (uniqueItemTypes.length > 1) {
    return "mixed";
  }

  return uniqueItemTypes[0] === "lesson" ? "lesson" : "publication";
}

export function isContentReleaseAudienceSegment(
  value: string,
): value is ContentReleaseRow["audience_segment"] {
  return CONTENT_RELEASE_AUDIENCE_SEGMENTS.includes(
    value as ContentReleaseRow["audience_segment"],
  );
}

export function isContentReleaseLocaleMode(
  value: string,
): value is ContentReleaseRow["locale_mode"] {
  return CONTENT_RELEASE_LOCALE_MODES.includes(
    value as ContentReleaseRow["locale_mode"],
  );
}

export function isContentReleaseEditableStatus(
  value: string,
): value is (typeof CONTENT_RELEASE_EDITABLE_STATUSES)[number] {
  return CONTENT_RELEASE_EDITABLE_STATUSES.includes(
    value as (typeof CONTENT_RELEASE_EDITABLE_STATUSES)[number],
  );
}

export function formatContentReleaseType(
  releaseType: ContentReleaseRow["release_type"],
) {
  switch (releaseType) {
    case "lesson":
      return "Lesson release";
    case "publication":
      return "Publication release";
    case "mixed":
      return "Mixed release";
    default:
      return releaseType;
  }
}

export function formatContentReleaseStatus(
  status: ContentReleaseRow["status"],
) {
  switch (status) {
    case "draft":
      return "Draft";
    case "approved":
      return "Approved";
    case "queued":
      return "Queued";
    case "sending":
      return "Sending";
    case "sent":
      return "Sent";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function formatContentReleaseAudienceSegment(
  segment: ContentReleaseRow["audience_segment"],
) {
  switch (segment) {
    case "lessons":
      return "Lesson subscribers";
    case "books":
      return "Book subscribers";
    case "general":
      return "General updates";
    default:
      return segment;
  }
}

export function formatContentReleaseLocaleMode(
  localeMode: ContentReleaseRow["locale_mode"],
) {
  switch (localeMode) {
    case "localized":
      return "Localized EN + NL";
    case "en_only":
      return "English only";
    case "nl_only":
      return "Dutch only";
    default:
      return localeMode;
  }
}

export function compareContentReleasePriority(
  left: AdminContentRelease,
  right: AdminContentRelease,
) {
  const statusPriority = {
    queued: 0,
    sending: 1,
    approved: 2,
    draft: 3,
    sent: 4,
    cancelled: 5,
  } as const;

  const byStatus = statusPriority[left.status] - statusPriority[right.status];
  if (byStatus !== 0) {
    return byStatus;
  }

  return (
    new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  );
}

export function getContentReleaseDeliverySummary(
  release: Pick<ContentReleaseRow, "delivery_summary">,
): ContentReleaseDeliverySummary {
  const summary = asObject(release.delivery_summary);
  if (!summary) {
    return {};
  }
  const broadcasts = getBroadcastSummaryEntries(summary);

  return {
    ...(broadcasts ? { broadcasts } : {}),
    eligibleRecipientCount: asOptionalNumber(summary.eligible_recipient_count),
    failedCount: asOptionalNumber(summary.failed_count),
    processedRecipientCount: asOptionalNumber(summary.processed_recipient_count),
    remainingRecipientCount: asOptionalNumber(summary.remaining_recipient_count),
    sentCount: asOptionalNumber(summary.sent_count),
    skippedCount: asOptionalNumber(summary.skipped_count),
  };
}

export function getContentReleaseDeliveryLanguage(
  release: Pick<ContentReleaseRow, "locale_mode">,
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
    ContentReleaseRow,
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
  items: Pick<ContentReleaseItemRow, "title_snapshot" | "url_snapshot">[];
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

function asObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function asOptionalNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asOptionalString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getBroadcastSummaryEntries(summary: Record<string, Json | undefined>) {
  const broadcasts = asObject(summary.broadcasts);
  if (!broadcasts) {
    return undefined;
  }

  const entries = (["en", "nl"] as const)
    .map((language) => {
      const entry = asObject(broadcasts[language]);
      if (!entry) {
        return null;
      }

      const id = asOptionalString(entry.id);
      const segmentId = asOptionalString(entry.segment_id);
      const subject = asOptionalString(entry.subject);
      const recipientCount = asOptionalNumber(entry.recipient_count);

      if (!id || !segmentId || !subject || recipientCount === undefined) {
        return null;
      }

      return {
        id,
        language,
        recipientCount,
        segmentId,
        subject,
      };
    })
    .filter((entry) => entry !== null);

  return entries.length > 0 ? entries : undefined;
}
