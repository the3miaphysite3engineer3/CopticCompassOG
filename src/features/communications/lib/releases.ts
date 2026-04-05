import type { Language } from "@/types/i18n";
import type { Json, Tables } from "@/types/supabase";
import { getMailFooterLines, mailBrand } from "@/lib/communications/mailBrand";

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
    processedRecipientCount: asOptionalNumber(
      summary.processed_recipient_count,
    ),
    remainingRecipientCount: asOptionalNumber(
      summary.remaining_recipient_count,
    ),
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

  return [
    intro,
    "",
    itemsHeading,
    itemsList,
    "",
    ...getMailFooterLines(options.language),
  ].join("\n");
}

export function buildContentReleaseEmailHtml(options: {
  body: string;
  items: Pick<ContentReleaseItemRow, "title_snapshot" | "url_snapshot">[];
  language: Language;
  subject: string;
}) {
  const intro = escapeHtml(options.body.trim()).replace(/\n/g, "<br />");
  const itemsHeading =
    options.language === "nl" ? "In deze release" : "In this release";
  const footer = getMailFooterLines(options.language).map(escapeHtml);
  const introLabel =
    options.language === "nl"
      ? "Nieuwe updates van Coptic Compass"
      : "New updates from Coptic Compass";

  const itemsHtml = options.items
    .map(
      (item) => `
        <li style="margin:0 0 14px;">
          <a href="${escapeHtml(item.url_snapshot)}" style="color:#0284c7;text-decoration:none;font-weight:600;">
            ${escapeHtml(item.title_snapshot)}
          </a>
          <div style="margin-top:4px;font-size:13px;color:#57534e;">${escapeHtml(item.url_snapshot)}</div>
        </li>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f5f4;padding:24px 12px;font-family:Aptos,Segoe UI,Helvetica Neue,Arial,sans-serif;color:#1c1917;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(24,30,27,0.08);">
      <div style="padding:28px 32px;background:linear-gradient(135deg,#ecfdf5 0%,#f0f9ff 100%);border-bottom:1px solid #e7e5e4;">
        <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#059669;font-weight:700;">${escapeHtml(
          introLabel,
        )}</div>
        <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#1c1917;">${escapeHtml(
          options.subject,
        )}</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#292524;">${intro}</p>
        <h2 style="margin:0 0 14px;font-size:18px;line-height:1.4;color:#1c1917;">${escapeHtml(
          itemsHeading,
        )}</h2>
        <ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
      </div>
      <div style="padding:24px 32px;border-top:1px solid #e7e5e4;background:#fafaf9;font-size:13px;line-height:1.7;color:#57534e;">
        <div>${footer[0]}</div>
        <div style="font-weight:700;color:#1c1917;">${footer[1]}</div>
        <div>${footer[2]}</div>
        <div style="margin-top:8px;"><a href="${mailBrand.liveUrl}" style="color:#059669;text-decoration:none;">${footer[3]}</a></div>
      </div>
    </div>
  </body>
</html>`;
}

function asObject(
  value: Json | undefined,
): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function asOptionalNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asOptionalString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
