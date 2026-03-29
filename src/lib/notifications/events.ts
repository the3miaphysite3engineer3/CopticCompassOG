import type { ReactElement } from "react";
import { getNotificationEmailEnv } from "@/lib/notifications/config";
import { sendNotificationEmail, type NotificationEmailResult } from "@/lib/notifications/email";
import { assertServerOnly } from "@/lib/server/assertServerOnly";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/config";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { Json, TablesInsert, TablesUpdate } from "@/types/supabase";

type EmailRecipients = string | readonly string[];

type LoggedNotificationEmailOptions = {
  aggregateId: string;
  aggregateType: string;
  bcc?: EmailRecipients;
  cc?: EmailRecipients;
  dedupeKey?: string | null;
  eventType: string;
  payload?: Json;
  react?: ReactElement;
  replyTo?: EmailRecipients;
  subject: string;
  text: string;
  to: EmailRecipients;
};

type LoggedOwnerAlertOptions = Omit<LoggedNotificationEmailOptions, "to">;

function normalizeRecipients(value: EmailRecipients) {
  return Array.isArray(value) ? [...value] : [value];
}

function formatRecipients(value: EmailRecipients) {
  return normalizeRecipients(value).join(", ");
}

async function insertNotificationEvent(options: {
  aggregateId: string;
  aggregateType: string;
  channel: "email";
  dedupeKey?: string | null;
  eventType: string;
  payload?: Json;
  recipient: string;
  subject: string;
}) {
  if (!hasSupabaseServiceRoleEnv()) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      aggregate_id: options.aggregateId,
      aggregate_type: options.aggregateType,
      channel: options.channel,
      dedupe_key: options.dedupeKey ?? null,
      event_type: options.eventType,
      payload: options.payload ?? {},
      recipient: options.recipient,
      subject: options.subject,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to store notification event", {
      aggregateId: options.aggregateId,
      aggregateType: options.aggregateType,
      code: error.code,
      eventType: options.eventType,
      message: error.message,
      recipient: options.recipient,
    });
    return null;
  }

  if (!data?.id) {
    console.error("Notification event insert did not return an id", {
      aggregateId: options.aggregateId,
      aggregateType: options.aggregateType,
      eventType: options.eventType,
      recipient: options.recipient,
    });
    return null;
  }

  return {
    id: data.id,
    supabase,
  };
}

async function recordNotificationOutcome(options: {
  eventId: string;
  recipient: string;
  result: NotificationEmailResult;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) {
  const processedAt = new Date().toISOString();
  const deliveryStatus: "sent" | "failed" = options.result.success ? "sent" : "failed";
  const deliveryInsert = {
    channel: "email" as const,
    error: options.result.success ? null : options.result.error,
    event_id: options.eventId,
    provider_message_id: options.result.success ? options.result.id : null,
    recipient: options.recipient,
    status: deliveryStatus,
  } satisfies TablesInsert<"notification_deliveries">;

  const { error: deliveryError } = await options.supabase
    .from("notification_deliveries")
    .insert(deliveryInsert);

  if (deliveryError) {
    console.error("Failed to store notification delivery", {
      code: deliveryError.code,
      eventId: options.eventId,
      message: deliveryError.message,
      recipient: options.recipient,
      status: deliveryStatus,
    });
  }

  const { error: eventUpdateError } = await options.supabase
    .from("notification_events")
    .update({
      last_error: options.result.success ? null : options.result.error,
      processed_at: processedAt,
      status: deliveryStatus,
    } satisfies TablesUpdate<"notification_events">)
    .eq("id", options.eventId);

  if (eventUpdateError) {
    console.error("Failed to update notification event status", {
      code: eventUpdateError.code,
      eventId: options.eventId,
      message: eventUpdateError.message,
      status: deliveryStatus,
    });
  }
}

export async function dispatchLoggedNotificationEmail(
  options: LoggedNotificationEmailOptions,
): Promise<NotificationEmailResult> {
  assertServerOnly("dispatchLoggedNotificationEmail");

  const recipient = formatRecipients(options.to);
  const storedEvent = await insertNotificationEvent({
    aggregateId: options.aggregateId,
    aggregateType: options.aggregateType,
    channel: "email",
    dedupeKey: options.dedupeKey,
    eventType: options.eventType,
    payload: options.payload,
    recipient,
    subject: options.subject,
  });

  const result = await sendNotificationEmail({
    ...(options.bcc ? { bcc: options.bcc } : {}),
    ...(options.cc ? { cc: options.cc } : {}),
    ...(options.react ? { react: options.react } : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    subject: options.subject,
    text: options.text,
    to: options.to,
  });

  if (storedEvent) {
    await recordNotificationOutcome({
      eventId: storedEvent.id,
      recipient,
      result,
      supabase: storedEvent.supabase,
    });
  }

  return result;
}

export async function dispatchLoggedOwnerAlertEmail(
  options: LoggedOwnerAlertOptions,
): Promise<NotificationEmailResult> {
  assertServerOnly("dispatchLoggedOwnerAlertEmail");

  const env = getNotificationEmailEnv();
  if (!env || !env.ownerAlertEmail) {
    return {
      success: false,
      error: "Owner alert email service is not configured.",
    };
  }

  return dispatchLoggedNotificationEmail({
    ...options,
    to: env.ownerAlertEmail,
  });
}
