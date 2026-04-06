import {
  buildContentReleaseEmailHtml,
  buildContentReleaseEmailText,
  buildContentReleaseNotificationDedupeKey,
  buildContentReleaseNotificationPayload,
  getContentReleaseCopyForLocale,
  getContentReleaseDeliverySummary,
  mergeContentReleaseDeliverySummary,
  normalizeEmail,
  parseContentReleaseInvocationPayload,
  type ContentReleaseRecord,
  type Language,
} from "../_shared/contentReleaseDelivery.ts";
import { hasExpectedBearerToken } from "../_shared/requestAuth.ts";
import {
  getProcessContentReleaseEnv,
  getResendBroadcastEnv,
  jsonResponse,
} from "./config.ts";
import { deliverReleaseByBroadcast } from "./broadcasts.ts";
import {
  insertNotificationDelivery,
  insertNotificationEvent,
  updateNotificationEventStatus,
} from "./notifications.ts";
import {
  claimQueuedRelease,
  countAudienceContacts,
  finalizeRelease,
  invokeNextBatch,
  loadAudienceContacts,
  loadRelease,
  loadReleaseItems,
  updateQueuedReleaseProgress,
} from "./supabaseRest.ts";

const RELEASE_BATCH_SIZE = 25;

declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

declare const EdgeRuntime:
  | {
      waitUntil(promise: Promise<unknown>): void;
    }
  | undefined;

async function sendResendEmail(options: {
  from: string;
  html?: string;
  resendApiKey: string;
  subject: string;
  text: string;
  to: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: options.from,
      ...(options.html ? { html: options.html } : {}),
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

async function finalizeReleaseWithoutItems(options: {
  errorMessage: string;
  releaseId: string;
  serviceRoleKey: string;
  status?: ContentReleaseRecord["status"];
  supabaseUrl: string;
}) {
  await finalizeRelease({
    cursor: null,
    lastDeliveryError: options.errorMessage,
    releaseId: options.releaseId,
    serviceRoleKey: options.serviceRoleKey,
    status: options.status ?? "approved",
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
}

async function finalizeReleaseWithEmptyAudience(options: {
  itemCount: number;
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  await finalizeRelease({
    cursor: null,
    lastDeliveryError:
      "No subscribed recipients match this release segment yet.",
    releaseId: options.releaseId,
    serviceRoleKey: options.serviceRoleKey,
    status: "approved",
    summary: {
      eligible_recipient_count: 0,
      failed_count: 0,
      item_count: options.itemCount,
      processed_recipient_count: 0,
      remaining_recipient_count: 0,
      sent_count: 0,
      skipped_count: 0,
    },
    supabaseUrl: options.supabaseUrl,
  });
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
    await finalizeReleaseWithoutItems({
      errorMessage: "This release has no snapshotted items to send yet.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
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
    await finalizeReleaseWithEmptyAudience({
      itemCount: releaseItems.length,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
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
      firstFailure ??=
        "This release is missing complete copy for one or more recipient locales.";
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
      firstFailure ??=
        "A notification event could not be stored for one or more recipients.";
      continue;
    }

    const emailResult = await sendResendEmail({
      from: options.notificationFromEmail,
      html: buildContentReleaseEmailHtml({
        body: copy.body,
        items: releaseItems,
        language: copy.language,
        subject: copy.subject,
      }),
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
    firstFailure ??= emailResult.error;
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

  const env = getProcessContentReleaseEnv();
  if (!env) {
    console.error("Missing one or more content release delivery secrets.");
    return jsonResponse(500, {
      error: "Content release delivery is not configured.",
    });
  }

  if (!hasExpectedBearerToken(request, env.serviceRoleKey)) {
    return jsonResponse(401, { error: "Unauthorized." });
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
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
  });

  if (!claimedRelease) {
    const currentRelease = await loadRelease({
      releaseId: invocation.releaseId,
      serviceRoleKey: env.serviceRoleKey,
      supabaseUrl: env.supabaseUrl,
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
    notificationFromEmail: env.notificationFromEmail,
    release: claimedRelease,
    resendApiKey: env.resendApiKey,
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
  }).catch(async (error) => {
    console.error("Unexpected content release worker failure.", error);

    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        error instanceof Error
          ? error.message
          : "The release worker failed unexpectedly.",
      releaseId: claimedRelease.id,
      serviceRoleKey: env.serviceRoleKey,
      status: "approved",
      summary: getContentReleaseDeliverySummary(claimedRelease),
      supabaseUrl: env.supabaseUrl,
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
