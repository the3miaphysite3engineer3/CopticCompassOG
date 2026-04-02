import {
  buildProfileSignupNotificationDedupeKey,
  buildProfileSignupNotificationPayload,
  buildProfileSignupOwnerAlert,
  parseProfileSignupPayload,
} from "../_shared/profileSignupAlert.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
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

function buildSupabaseRestHeaders(serviceRoleKey: string) {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
  };
}

async function insertNotificationEvent(options: {
  aggregateId: string;
  aggregateType: string;
  dedupeKey: string;
  eventType: string;
  payload: Record<string, string | null>;
  recipient: string;
  subject: string;
  supabaseServiceRoleKey: string;
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
        ...buildSupabaseRestHeaders(options.supabaseServiceRoleKey),
        Prefer: "return=representation",
      },
      method: "POST",
    },
  );

  if (response.ok) {
    const data = (await response.json()) as Array<{ id?: string }>;
    const eventId = data[0]?.id;

    if (!eventId) {
      console.error("Signup notification event insert returned no id.");
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

  console.error("Failed to insert signup notification event.", {
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
  status: "failed" | "sent";
  supabaseServiceRoleKey: string;
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
      headers: buildSupabaseRestHeaders(options.supabaseServiceRoleKey),
      method: "POST",
    },
  );

  if (!response.ok) {
    console.error("Failed to insert signup notification delivery.", {
      error: await response.text(),
      eventId: options.eventId,
      status: response.status,
    });
  }
}

async function updateNotificationEventStatus(options: {
  eventId: string;
  lastError: string | null;
  status: "failed" | "sent";
  supabaseServiceRoleKey: string;
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
      headers: buildSupabaseRestHeaders(options.supabaseServiceRoleKey),
      method: "PATCH",
    },
  );

  if (!response.ok) {
    console.error("Failed to update signup notification event status.", {
      error: await response.text(),
      eventId: options.eventId,
      status: response.status,
    });
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const ownerAlertEmail = Deno.env.get("OWNER_ALERT_EMAIL");
  const notificationFromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL");

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey ||
    !resendApiKey ||
    !ownerAlertEmail ||
    !notificationFromEmail
  ) {
    console.error("Missing one or more signup alert email secrets.");
    return jsonResponse(500, {
      error: "Signup alert email service is not configured.",
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("Failed to parse signup alert webhook payload.", error);
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const signupRecord = parseProfileSignupPayload(payload);
  if (!signupRecord) {
    return jsonResponse(202, {
      ignored: true,
      message: "Webhook payload did not contain a profile INSERT record.",
    });
  }

  const ownerAlert = buildProfileSignupOwnerAlert(signupRecord);
  const notificationEvent = await insertNotificationEvent({
    aggregateId: signupRecord.id,
    aggregateType: "profile",
    dedupeKey: buildProfileSignupNotificationDedupeKey(signupRecord),
    eventType: "profile_signup",
    payload: buildProfileSignupNotificationPayload(signupRecord),
    recipient: ownerAlertEmail,
    subject: ownerAlert.subject,
    supabaseServiceRoleKey,
    supabaseUrl,
  });

  if (notificationEvent?.duplicate) {
    return jsonResponse(200, {
      duplicate: true,
      profileId: signupRecord.id,
      success: true,
    });
  }

  const emailResult = await sendResendEmail({
    from: notificationFromEmail,
    resendApiKey,
    subject: ownerAlert.subject,
    text: ownerAlert.text,
    to: ownerAlertEmail,
  });

  if (!emailResult.success) {
    if (notificationEvent?.eventId) {
      await insertNotificationDelivery({
        error: emailResult.error,
        eventId: notificationEvent.eventId,
        providerMessageId: null,
        recipient: ownerAlertEmail,
        status: "failed",
        supabaseServiceRoleKey,
        supabaseUrl,
      });
      await updateNotificationEventStatus({
        eventId: notificationEvent.eventId,
        lastError: emailResult.error,
        status: "failed",
        supabaseServiceRoleKey,
        supabaseUrl,
      });
    }

    console.error("Failed to send signup alert email.", {
      error: emailResult.error,
      profileId: signupRecord.id,
    });
    return jsonResponse(502, { error: "Failed to send signup alert email." });
  }

  if (notificationEvent?.eventId) {
    await insertNotificationDelivery({
      error: null,
      eventId: notificationEvent.eventId,
      providerMessageId: emailResult.id,
      recipient: ownerAlertEmail,
      status: "sent",
      supabaseServiceRoleKey,
      supabaseUrl,
    });
    await updateNotificationEventStatus({
      eventId: notificationEvent.eventId,
      lastError: null,
      status: "sent",
      supabaseServiceRoleKey,
      supabaseUrl,
    });
  }

  return jsonResponse(200, {
    success: true,
    profileId: signupRecord.id,
  });
});
