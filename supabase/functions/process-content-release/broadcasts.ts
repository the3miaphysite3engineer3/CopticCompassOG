import {
  buildContentReleaseEmailHtml,
  buildContentReleaseEmailText,
  buildContentReleaseNotificationDedupeKey,
  getContentReleaseBroadcastDeliveries,
  getContentReleaseCopyForLocale,
  getContentReleaseDeliverySummary,
  type ContentReleaseBroadcastDelivery,
  type ContentReleaseDeliverySummary,
  type ContentReleaseItemRecord,
  type ContentReleaseRecord,
  type Language,
} from "../_shared/contentReleaseDelivery.ts";
import type { ResendBroadcastEnv } from "./config.ts";
import {
  countAudienceContacts,
  finalizeRelease,
  loadReleaseItems,
} from "./supabaseRest.ts";
import {
  insertNotificationDelivery,
  insertNotificationEvent,
  updateNotificationEventStatus,
} from "./notifications.ts";

type ReleaseBroadcastTarget = {
  html: string;
  language: Language;
  recipientCount: number;
  segmentId: string;
  subject: string;
  text: string;
};

async function createResendBroadcast(options: {
  from: string;
  html?: string;
  name: string;
  resendApiKey: string;
  segmentId: string;
  subject: string;
  text: string;
}) {
  const response = await fetch("https://api.resend.com/broadcasts", {
    body: JSON.stringify({
      from: options.from,
      ...(options.html ? { html: options.html } : {}),
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
        html: buildContentReleaseEmailHtml({
          body: copy.body,
          items: options.releaseItems,
          language,
          subject: copy.subject,
        }),
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
        html: buildContentReleaseEmailHtml({
          body: copy.body,
          items: options.releaseItems,
          language,
          subject: copy.subject,
        }),
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
  broadcasts: Partial<Record<Language, ContentReleaseBroadcastDelivery>>;
  failedRecipientCount: number;
  itemCount: number;
  targetedRecipientCount: number;
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

export async function deliverReleaseByBroadcast(options: {
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
      html: target.html,
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
