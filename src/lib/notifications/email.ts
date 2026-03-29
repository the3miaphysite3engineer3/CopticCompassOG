import { Resend } from "resend";
import type { ReactElement } from "react";
import { assertServerOnly } from "@/lib/server/assertServerOnly";
import { getNotificationEmailEnv } from "@/lib/notifications/config";

type EmailRecipients = string | readonly string[];

type BaseEmailOptions = {
  bcc?: EmailRecipients;
  cc?: EmailRecipients;
  from?: string;
  react?: ReactElement;
  replyTo?: EmailRecipients;
  subject: string;
  text: string;
  to: EmailRecipients;
};

export type NotificationEmailResult =
  | {
      success: true;
      id: string | null;
    }
  | {
      success: false;
      error: string;
    };

type OwnerAlertEmailOptions = Omit<BaseEmailOptions, "to">;

function normalizeRecipients(value: EmailRecipients | undefined) {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? [...value] : [value];
}

export async function sendNotificationEmail(
  options: BaseEmailOptions,
): Promise<NotificationEmailResult> {
  assertServerOnly("sendNotificationEmail");

  const env = getNotificationEmailEnv();
  if (!env) {
    return {
      success: false,
      error: "Notification email service is not configured.",
    };
  }

  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: options.from ?? env.notificationFromEmail,
    to: normalizeRecipients(options.to) ?? [],
    subject: options.subject,
    text: options.text,
    ...(options.react ? { react: options.react } : {}),
    ...(options.replyTo
      ? { replyTo: normalizeRecipients(options.replyTo) }
      : {}),
    ...(options.cc ? { cc: normalizeRecipients(options.cc) } : {}),
    ...(options.bcc ? { bcc: normalizeRecipients(options.bcc) } : {}),
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to send notification email.",
    };
  }

  return {
    success: true,
    id: data?.id ?? null,
  };
}

export async function sendOwnerAlertEmail(
  options: OwnerAlertEmailOptions,
): Promise<NotificationEmailResult> {
  assertServerOnly("sendOwnerAlertEmail");

  const env = getNotificationEmailEnv();
  if (!env || !env.ownerAlertEmail) {
    return {
      success: false,
      error: "Owner alert email service is not configured.",
    };
  }

  return sendNotificationEmail({
    ...options,
    to: env.ownerAlertEmail,
  });
}
