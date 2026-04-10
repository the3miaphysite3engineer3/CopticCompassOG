import { hasExpectedBearerToken } from "../_shared/requestAuth.ts";

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

const NOTIFICATION_JOB_BATCH_SIZE = 5;

type NotificationEmailJobRecord = {
  bcc_recipients: string[];
  cc_recipients: string[];
  from_email: string | null;
  html_body: string | null;
  id: string;
  notification_event_id: string;
  reply_to_recipients: string[];
  subject: string;
  text_body: string;
  to_recipients: string[];
};

type ProcessNotificationEmailEnv = {
  notificationFromEmail: string;
  resendApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

function getProcessNotificationEmailEnv() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const notificationFromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL");

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !resendApiKey ||
    !notificationFromEmail
  ) {
    return null;
  }

  return {
    notificationFromEmail,
    resendApiKey,
    serviceRoleKey,
    supabaseUrl,
  } satisfies ProcessNotificationEmailEnv;
}

function buildSupabaseRestHeaders(serviceRoleKey: string) {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
  };
}

function buildResendEmailBody(options: {
  from: string;
  html?: string | null;
  subject: string;
  text: string;
  to: string[];
  bcc?: string[];
  cc?: string[];
  replyTo?: string[];
}) {
  return {
    ...(options.bcc && options.bcc.length > 0 ? { bcc: options.bcc } : {}),
    ...(options.cc && options.cc.length > 0 ? { cc: options.cc } : {}),
    ...(options.html ? { html: options.html } : {}),
    ...(options.replyTo && options.replyTo.length > 0
      ? { reply_to: options.replyTo }
      : {}),
    from: options.from,
    subject: options.subject,
    text: options.text,
    to: options.to,
  };
}

async function sendResendEmail(options: {
  from: string;
  html?: string | null;
  resendApiKey: string;
  subject: string;
  text: string;
  to: string[];
  bcc?: string[];
  cc?: string[];
  replyTo?: string[];
}) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify(buildResendEmailBody(options)),
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

async function claimNotificationEmailJob(options: {
  jobId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/notification_email_jobs?id=eq.${encodeURIComponent(options.jobId)}&status=eq.queued&select=*`,
    {
      body: JSON.stringify({
        last_error: null,
        status: "processing",
      }),
      headers: {
        ...buildSupabaseRestHeaders(options.serviceRoleKey),
        Prefer: "return=representation",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    console.error("Failed to claim notification email job.", {
      error: await response.text(),
      jobId: options.jobId,
      status: response.status,
    });
    return null;
  }

  const data = (await response.json()) as NotificationEmailJobRecord[];
  return data[0] ?? null;
}

async function listQueuedNotificationEmailJobIds(options: {
  limit: number;
  serviceRoleKey: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/notification_email_jobs?status=eq.queued&select=id&order=created_at.asc&limit=${options.limit}`,
    {
      headers: buildSupabaseRestHeaders(options.serviceRoleKey),
      method: "GET",
    },
  );

  if (!response.ok) {
    console.error("Failed to list queued notification email jobs.", {
      error: await response.text(),
      status: response.status,
    });
    return [];
  }

  const data = (await response.json()) as Array<{ id?: string }>;
  return data
    .map((row) => row.id)
    .filter((jobId): jobId is string => typeof jobId === "string");
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
    console.error("Failed to insert notification delivery.", {
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
    console.error("Failed to update notification event status.", {
      error: await response.text(),
      eventId: options.eventId,
      status: response.status,
    });
  }
}

async function updateNotificationEmailJobStatus(options: {
  jobId: string;
  lastError: string | null;
  serviceRoleKey: string;
  status: "failed" | "sent";
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${options.supabaseUrl}/rest/v1/notification_email_jobs?id=eq.${encodeURIComponent(options.jobId)}`,
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
    console.error("Failed to update notification email job status.", {
      error: await response.text(),
      jobId: options.jobId,
      status: response.status,
    });
  }
}

async function processClaimedNotificationEmailJob(options: {
  env: ProcessNotificationEmailEnv;
  job: NotificationEmailJobRecord;
}) {
  const emailResult = await sendResendEmail({
    ...(options.job.bcc_recipients.length > 0
      ? { bcc: options.job.bcc_recipients }
      : {}),
    ...(options.job.cc_recipients.length > 0
      ? { cc: options.job.cc_recipients }
      : {}),
    ...(options.job.reply_to_recipients.length > 0
      ? { replyTo: options.job.reply_to_recipients }
      : {}),
    from: options.job.from_email ?? options.env.notificationFromEmail,
    html: options.job.html_body,
    resendApiKey: options.env.resendApiKey,
    subject: options.job.subject,
    text: options.job.text_body,
    to: options.job.to_recipients,
  });
  const deliveryStatus: "failed" | "sent" = emailResult.success
    ? "sent"
    : "failed";
  const recipientSummary = options.job.to_recipients.join(", ");

  await insertNotificationDelivery({
    error: emailResult.success ? null : emailResult.error,
    eventId: options.job.notification_event_id,
    providerMessageId: emailResult.success ? emailResult.id : null,
    recipient: recipientSummary,
    serviceRoleKey: options.env.serviceRoleKey,
    status: deliveryStatus,
    supabaseUrl: options.env.supabaseUrl,
  });
  await updateNotificationEventStatus({
    eventId: options.job.notification_event_id,
    lastError: emailResult.success ? null : emailResult.error,
    serviceRoleKey: options.env.serviceRoleKey,
    status: deliveryStatus,
    supabaseUrl: options.env.supabaseUrl,
  });
  await updateNotificationEmailJobStatus({
    jobId: options.job.id,
    lastError: emailResult.success ? null : emailResult.error,
    serviceRoleKey: options.env.serviceRoleKey,
    status: deliveryStatus,
    supabaseUrl: options.env.supabaseUrl,
  });
}

async function processQueuedNotificationEmailJobs(options: {
  env: ProcessNotificationEmailEnv;
  jobId?: string;
}) {
  const jobIds = options.jobId
    ? [options.jobId]
    : await listQueuedNotificationEmailJobIds({
        limit: NOTIFICATION_JOB_BATCH_SIZE,
        serviceRoleKey: options.env.serviceRoleKey,
        supabaseUrl: options.env.supabaseUrl,
      });

  for (const jobId of jobIds) {
    const claimedJob = await claimNotificationEmailJob({
      jobId,
      serviceRoleKey: options.env.serviceRoleKey,
      supabaseUrl: options.env.supabaseUrl,
    });

    if (!claimedJob) {
      continue;
    }

    try {
      await processClaimedNotificationEmailJob({
        env: options.env,
        job: claimedJob,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "The notification email job failed unexpectedly.";
      console.error("Notification email job failed unexpectedly.", {
        error: errorMessage,
        jobId: claimedJob.id,
      });
      await updateNotificationEventStatus({
        eventId: claimedJob.notification_event_id,
        lastError: errorMessage,
        serviceRoleKey: options.env.serviceRoleKey,
        status: "failed",
        supabaseUrl: options.env.supabaseUrl,
      });
      await updateNotificationEmailJobStatus({
        jobId: claimedJob.id,
        lastError: errorMessage,
        serviceRoleKey: options.env.serviceRoleKey,
        status: "failed",
        supabaseUrl: options.env.supabaseUrl,
      });
    }
  }
}

async function parseWorkerInvocationRequest(request: Request) {
  try {
    const body = (await request.json()) as { jobId?: unknown } | null;
    const jobId =
      body && typeof body.jobId === "string" && body.jobId.trim().length > 0
        ? body.jobId.trim()
        : undefined;

    return { jobId };
  } catch {
    return { jobId: undefined };
  }
}

async function scheduleNotificationJobProcessing(options: {
  env: ProcessNotificationEmailEnv;
  jobId?: string;
}) {
  const backgroundTask = processQueuedNotificationEmailJobs(options);

  if (
    typeof EdgeRuntime !== "undefined" &&
    typeof EdgeRuntime.waitUntil === "function"
  ) {
    EdgeRuntime.waitUntil(backgroundTask);
    return;
  }

  await backgroundTask;
}

async function handleProcessNotificationEmailRequest(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const env = getProcessNotificationEmailEnv();
  if (!env) {
    console.error("Missing one or more notification email worker secrets.");
    return jsonResponse(500, {
      error: "Notification email processing is not configured.",
    });
  }

  if (!hasExpectedBearerToken(request, env.serviceRoleKey)) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const invocation = await parseWorkerInvocationRequest(request);
  await scheduleNotificationJobProcessing({
    env,
    ...(invocation.jobId ? { jobId: invocation.jobId } : {}),
  });

  return jsonResponse(202, {
    ...(invocation.jobId ? { jobId: invocation.jobId } : {}),
    queued: true,
    success: true,
  });
}

Deno.serve(handleProcessNotificationEmailRequest);
