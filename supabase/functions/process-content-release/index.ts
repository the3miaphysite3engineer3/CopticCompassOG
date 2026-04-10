import { deliverReleaseByBroadcast } from "./broadcasts.ts";
import {
  getProcessContentReleaseEnv,
  getResendBroadcastEnv,
  jsonResponse,
} from "./config.ts";
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

async function finalizeReleaseWithRecipientCountError(options: {
  itemCount: number;
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  await finalizeRelease({
    cursor: null,
    lastDeliveryError:
      "Could not count subscribed recipients for this release.",
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

type ReleaseDeliveryOptions = {
  notificationFromEmail: string;
  release: ContentReleaseRecord;
  resendApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
};

type DeliverySummary = ReturnType<typeof getContentReleaseDeliverySummary>;
type ReleaseItems = NonNullable<Awaited<ReturnType<typeof loadReleaseItems>>>;
type AudienceContacts = NonNullable<
  Awaited<ReturnType<typeof loadAudienceContacts>>
>;
type AudienceContact = AudienceContacts[number];

async function finalizeReleaseWithoutContacts(options: {
  previousSummary: DeliverySummary;
  release: ContentReleaseRecord;
  releaseItems: ReleaseItems;
  serviceRoleKey: string;
  supabaseUrl: string;
  totalEligibleRecipients: number;
}) {
  const summary = {
    ...options.previousSummary,
    eligible_recipient_count: options.totalEligibleRecipients,
    item_count: options.releaseItems.length,
    remaining_recipient_count: 0,
  };

  await finalizeRelease({
    cursor: null,
    lastDeliveryError:
      options.previousSummary.failed_count > 0
        ? (options.release.last_delivery_error ??
          "Some release deliveries failed.")
        : null,
    releaseId: options.release.id,
    serviceRoleKey: options.serviceRoleKey,
    status: options.previousSummary.failed_count > 0 ? "approved" : "sent",
    summary,
    supabaseUrl: options.supabaseUrl,
  });
}

async function validateReleaseRecipientsAndItems(options: {
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
    await finalizeReleaseWithoutItems({
      errorMessage: "This release has no snapshotted items to send yet.",
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });
    return { error: true as const };
  }

  const totalEligibleRecipients = await countAudienceContacts({
    audienceSegment: options.release.audience_segment,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (totalEligibleRecipients === null) {
    await finalizeReleaseWithRecipientCountError({
      itemCount: releaseItems.length,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });
    return { error: true as const };
  }

  if (totalEligibleRecipients === 0) {
    await finalizeReleaseWithEmptyAudience({
      itemCount: releaseItems.length,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });
    return { error: true as const };
  }

  return { error: false as const, releaseItems, totalEligibleRecipients };
}

/**
 * Loads the release items, recipient counts, and current batch of contacts
 * needed to process one delivery step. When the release cannot continue, this
 * helper finalizes it with the most appropriate terminal state and returns null.
 */
async function loadReleaseBatchContext(
  options: Pick<
    ReleaseDeliveryOptions,
    "release" | "serviceRoleKey" | "supabaseUrl"
  >,
) {
  const validationResult = await validateReleaseRecipientsAndItems(options);
  if (validationResult.error) {
    return null;
  }

  const { releaseItems, totalEligibleRecipients } = validationResult;

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
    return null;
  }

  const hasMoreRecipients = audienceContacts.length > RELEASE_BATCH_SIZE;
  const contactsToProcess = audienceContacts.slice(0, RELEASE_BATCH_SIZE);

  if (contactsToProcess.length === 0) {
    await finalizeReleaseWithoutContacts({
      previousSummary,
      release: options.release,
      releaseItems,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
      totalEligibleRecipients,
    });
    return null;
  }

  return {
    contactsToProcess,
    hasMoreRecipients,
    previousSummary,
    releaseItems,
    totalEligibleRecipients,
  };
}

async function recordContactDeliveryOutcome(options: {
  error: string | null;
  eventId: string;
  providerMessageId: string | null;
  recipient: string;
  serviceRoleKey: string;
  status: "failed" | "sent";
  supabaseUrl: string;
}) {
  await insertNotificationDelivery({
    error: options.error,
    eventId: options.eventId,
    providerMessageId: options.providerMessageId,
    recipient: options.recipient,
    serviceRoleKey: options.serviceRoleKey,
    status: options.status,
    supabaseUrl: options.supabaseUrl,
  });
  await updateNotificationEventStatus({
    eventId: options.eventId,
    lastError: options.error,
    serviceRoleKey: options.serviceRoleKey,
    status: options.status,
    supabaseUrl: options.supabaseUrl,
  });
}

async function createDeliveryNotificationEvent(options: {
  contact: AudienceContact;
  copy: ReturnType<typeof getContentReleaseCopyForLocale>;
  normalizedRecipient: string;
  release: ContentReleaseRecord;
  releaseItems: ReleaseItems;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  return insertNotificationEvent({
    aggregateId: options.release.id,
    aggregateType: "content_release",
    dedupeKey: buildContentReleaseNotificationDedupeKey({
      eventType: "content_release_sent",
      recipient: options.normalizedRecipient,
      releaseId: options.release.id,
    }),
    eventType: "content_release_sent",
    payload: buildContentReleaseNotificationPayload({
      contact: options.contact,
      itemCount: options.releaseItems.length,
      language: options.copy.language,
      release: options.release,
    }),
    recipient: options.normalizedRecipient,
    serviceRoleKey: options.serviceRoleKey,
    subject: options.copy.subject ?? "Release Document",
    supabaseUrl: options.supabaseUrl,
  });
}

async function dispatchContactEmail(options: {
  copy: ReturnType<typeof getContentReleaseCopyForLocale> & {
    subject: string;
    body: string;
  };
  normalizedRecipient: string;
  notificationFromEmail: string;
  releaseItems: ReleaseItems;
  resendApiKey: string;
}) {
  return sendResendEmail({
    from: options.notificationFromEmail,
    html: buildContentReleaseEmailHtml({
      body: options.copy.body,
      items: options.releaseItems,
      language: options.copy.language,
      subject: options.copy.subject,
    }),
    resendApiKey: options.resendApiKey,
    subject: options.copy.subject,
    text: buildContentReleaseEmailText({
      body: options.copy.body,
      items: options.releaseItems,
      language: options.copy.language,
    }),
    to: options.normalizedRecipient,
  });
}

/**
 * Delivers one release to a single contact, handling notification event
 * dedupe, email rendering, provider delivery, and delivery-state persistence.
 */
async function deliverReleaseToContact(options: {
  contact: AudienceContact;
  notificationFromEmail: string;
  release: ContentReleaseRecord;
  releaseItems: ReleaseItems;
  resendApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const normalizedRecipient = normalizeEmail(options.contact.email);
  const preferredLocale: Language =
    options.contact.locale === "nl" ? "nl" : "en";
  const copy = getContentReleaseCopyForLocale(options.release, preferredLocale);

  if (!copy.subject || !copy.body) {
    return {
      status: "failed" as const,
      error:
        "This release is missing complete copy for one or more recipient locales.",
    };
  }

  const notificationEvent = await createDeliveryNotificationEvent({
    contact: options.contact,
    copy,
    normalizedRecipient,
    release: options.release,
    releaseItems: options.releaseItems,
    serviceRoleKey: options.serviceRoleKey,
    supabaseUrl: options.supabaseUrl,
  });

  if (notificationEvent?.duplicate) {
    return { status: "skipped" as const };
  }

  if (!notificationEvent?.eventId) {
    return {
      status: "failed" as const,
      error:
        "A notification event could not be stored for one or more recipients.",
    };
  }

  const emailResult = await dispatchContactEmail({
    copy: copy as typeof copy & { subject: string; body: string },
    normalizedRecipient,
    notificationFromEmail: options.notificationFromEmail,
    releaseItems: options.releaseItems,
    resendApiKey: options.resendApiKey,
  });

  if (emailResult.success) {
    await recordContactDeliveryOutcome({
      error: null,
      eventId: notificationEvent.eventId,
      providerMessageId: emailResult.id,
      recipient: normalizedRecipient,
      serviceRoleKey: options.serviceRoleKey,
      status: "sent",
      supabaseUrl: options.supabaseUrl,
    });

    return { status: "sent" as const };
  }

  await recordContactDeliveryOutcome({
    error: emailResult.error,
    eventId: notificationEvent.eventId,
    providerMessageId: null,
    recipient: normalizedRecipient,
    serviceRoleKey: options.serviceRoleKey,
    status: "failed",
    supabaseUrl: options.supabaseUrl,
  });

  return {
    status: "failed" as const,
    error: emailResult.error,
  };
}

/**
 * Processes one contact batch sequentially so delivery state stays easy to
 * reason about and the first failure can be surfaced in the release summary.
 */
async function processReleaseContacts(options: {
  contactsToProcess: AudienceContact[];
  notificationFromEmail: string;
  release: ContentReleaseRecord;
  releaseItems: ReleaseItems;
  resendApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let firstFailure: string | null = null;

  for (const contact of options.contactsToProcess) {
    const deliveryResult = await deliverReleaseToContact({
      contact,
      notificationFromEmail: options.notificationFromEmail,
      release: options.release,
      releaseItems: options.releaseItems,
      resendApiKey: options.resendApiKey,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });

    if (deliveryResult.status === "sent") {
      sentCount += 1;
      continue;
    }

    if (deliveryResult.status === "skipped") {
      skippedCount += 1;
      continue;
    }

    failedCount += 1;
    firstFailure ??= deliveryResult.error ?? null;
  }

  return {
    failedCount,
    firstFailure,
    sentCount,
    skippedCount,
  };
}

/**
 * Applies the outcome of the current batch by either finalizing the release,
 * updating the queued cursor, or chaining the next batch invocation.
 */
async function finalizeProcessedReleaseBatch(options: {
  contactsToProcess: AudienceContact[];
  failedCount: number;
  firstFailure: string | null;
  hasMoreRecipients: boolean;
  mergedSummary: DeliverySummary;
  release: ContentReleaseRecord;
  sentCount: number;
  serviceRoleKey: string;
  skippedCount: number;
  supabaseUrl: string;
}) {
  if (options.failedCount > 0) {
    await finalizeRelease({
      cursor: null,
      lastDeliveryError:
        options.firstFailure ??
        `Sent ${options.sentCount}, skipped ${options.skippedCount}, failed ${options.failedCount}.`,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      status: "approved",
      summary: options.mergedSummary,
      supabaseUrl: options.supabaseUrl,
    });
    return;
  }

  if (options.hasMoreRecipients) {
    const nextCursor =
      options.contactsToProcess[options.contactsToProcess.length - 1]?.email ??
      null;

    await updateQueuedReleaseProgress({
      cursor: nextCursor,
      lastDeliveryError: null,
      releaseId: options.release.id,
      serviceRoleKey: options.serviceRoleKey,
      summary: options.mergedSummary,
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
        summary: options.mergedSummary,
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
    summary: options.mergedSummary,
    supabaseUrl: options.supabaseUrl,
  });
}

/**
 * Delivers one release batch using Resend broadcasts when available, otherwise
 * falling back to per-recipient delivery with queued batch chaining.
 */
async function deliverReleaseBatch(options: ReleaseDeliveryOptions) {
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

  const batchContext = await loadReleaseBatchContext(options);
  if (!batchContext) {
    return;
  }

  const {
    contactsToProcess,
    hasMoreRecipients,
    previousSummary,
    releaseItems,
    totalEligibleRecipients,
  } = batchContext;

  const { failedCount, firstFailure, sentCount, skippedCount } =
    await processReleaseContacts({
      contactsToProcess,
      notificationFromEmail: options.notificationFromEmail,
      release: options.release,
      releaseItems,
      resendApiKey: options.resendApiKey,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    });

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

  await finalizeProcessedReleaseBatch({
    contactsToProcess,
    failedCount,
    firstFailure,
    hasMoreRecipients,
    mergedSummary,
    release: options.release,
    sentCount,
    serviceRoleKey: options.serviceRoleKey,
    skippedCount,
    supabaseUrl: options.supabaseUrl,
  });
}

/**
 * Parses the worker invocation JSON and returns a ready-made response when the
 * request body is malformed or missing a release id.
 */
async function parseReleaseInvocationRequest(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("Failed to parse content release worker payload.", error);
    return {
      invocation: null,
      response: jsonResponse(400, { error: "Invalid JSON payload." }),
    };
  }

  const invocation = parseContentReleaseInvocationPayload(payload);
  if (!invocation) {
    return {
      invocation: null,
      response: jsonResponse(400, { error: "A valid releaseId is required." }),
    };
  }

  return {
    invocation,
    response: null,
  };
}

/**
 * Claims the queued release for processing, or returns the correct webhook
 * response when the release is missing or no longer eligible to run.
 */
async function claimReleaseForProcessing(options: {
  releaseId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const claimedRelease = await claimQueuedRelease(options);
  if (claimedRelease) {
    return {
      release: claimedRelease,
      response: null,
    };
  }

  const currentRelease = await loadRelease(options);
  if (!currentRelease) {
    return {
      release: null,
      response: jsonResponse(404, { error: "Release draft not found." }),
    };
  }

  if (currentRelease.status === "sending" || currentRelease.status === "sent") {
    return {
      release: null,
      response: jsonResponse(202, {
        releaseId: options.releaseId,
        success: true,
      }),
    };
  }

  return {
    release: null,
    response: jsonResponse(409, {
      error: "Only queued releases can be processed.",
    }),
  };
}

/**
 * Finalizes the release back into an approved state when the background worker
 * crashes unexpectedly.
 */
async function handleUnexpectedWorkerFailure(options: {
  error: unknown;
  release: ContentReleaseRecord;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  console.error("Unexpected content release worker failure.", options.error);

  await finalizeRelease({
    cursor: null,
    lastDeliveryError:
      options.error instanceof Error
        ? options.error.message
        : "The release worker failed unexpectedly.",
    releaseId: options.release.id,
    serviceRoleKey: options.serviceRoleKey,
    status: "approved",
    summary: getContentReleaseDeliverySummary(options.release),
    supabaseUrl: options.supabaseUrl,
  });
}

/**
 * Starts the delivery batch and hands it to `waitUntil` when the edge runtime
 * supports background execution.
 */
async function scheduleReleaseBatch(options: {
  notificationFromEmail: string;
  release: ContentReleaseRecord;
  resendApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const backgroundTask = deliverReleaseBatch(options).catch((error) =>
    handleUnexpectedWorkerFailure({
      error,
      release: options.release,
      serviceRoleKey: options.serviceRoleKey,
      supabaseUrl: options.supabaseUrl,
    }),
  );

  if (
    typeof EdgeRuntime !== "undefined" &&
    typeof EdgeRuntime.waitUntil === "function"
  ) {
    EdgeRuntime.waitUntil(backgroundTask);
    return;
  }

  await backgroundTask;
}

/**
 * Validates the worker request, claims the queued release, and starts the
 * background delivery chain.
 */
async function handleProcessContentReleaseRequest(request: Request) {
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

  const parsedRequest = await parseReleaseInvocationRequest(request);
  if (parsedRequest.response) {
    return parsedRequest.response;
  }

  const claimedReleaseResult = await claimReleaseForProcessing({
    releaseId: parsedRequest.invocation.releaseId,
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
  });
  if (claimedReleaseResult.response) {
    return claimedReleaseResult.response;
  }

  const claimedRelease = claimedReleaseResult.release;

  await scheduleReleaseBatch({
    notificationFromEmail: env.notificationFromEmail,
    release: claimedRelease,
    resendApiKey: env.resendApiKey,
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
  });

  return jsonResponse(202, {
    batchSize: RELEASE_BATCH_SIZE,
    queued: true,
    releaseId: claimedRelease.id,
    success: true,
  });
}

Deno.serve(handleProcessContentReleaseRequest);
