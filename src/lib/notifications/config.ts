import { assertServerOnly } from "@/lib/server/assertServerOnly";

export function getNotificationEmailEnv() {
  assertServerOnly("getNotificationEmailEnv");

  const resendApiKey = process.env.RESEND_API_KEY;
  const notificationFromEmail = process.env.NOTIFICATION_FROM_EMAIL;

  if (!resendApiKey || !notificationFromEmail) {
    return null;
  }

  return {
    resendApiKey,
    ownerAlertEmail: process.env.OWNER_ALERT_EMAIL ?? null,
    notificationFromEmail,
  };
}

export function hasNotificationEmailEnv() {
  return getNotificationEmailEnv() !== null;
}
