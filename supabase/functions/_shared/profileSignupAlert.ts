type DatabaseWebhookPayload<RecordType = Record<string, unknown>> = {
  old_record?: RecordType | null;
  record?: RecordType | null;
  schema?: string;
  table?: string;
  type?: string;
};

type ProfileSignupRecord = {
  createdAt: string | null;
  email: string | null;
  fullName: string | null;
  id: string;
};

/**
 * Redacts an email address before it is written into notification payloads or
 * logs that do not need the full recipient value.
 */
export function redactEmailAddress(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.indexOf("@");

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return "[redacted email]";
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  const visibleLocal =
    localPart.length <= 2 ? localPart.slice(0, 1) : localPart.slice(0, 2);

  return `${visibleLocal}***@${domain}`;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Parses the profile-insert webhook payload into the minimal record required by
 * the signup alert worker, ignoring other webhook types and malformed rows.
 */
export function parseProfileSignupPayload(
  payload: unknown,
): ProfileSignupRecord | null {
  const webhookPayload = asObject(payload) as DatabaseWebhookPayload | null;
  if (!webhookPayload) {
    return null;
  }

  if (
    webhookPayload.type !== "INSERT" ||
    webhookPayload.schema !== "public" ||
    webhookPayload.table !== "profiles"
  ) {
    return null;
  }

  const record = asObject(webhookPayload.record);
  if (!record) {
    return null;
  }

  const id = asOptionalString(record.id);
  if (!id) {
    return null;
  }

  return {
    createdAt: asOptionalString(record.created_at),
    email: asOptionalString(record.email),
    fullName: asOptionalString(record.full_name),
    id,
  };
}

/**
 * Builds the owner-alert email subject and body for a new profile signup.
 */
export function buildProfileSignupOwnerAlert(record: ProfileSignupRecord) {
  const subjectTarget = record.email ?? record.fullName ?? record.id;

  return {
    subject: `New Coptic Compass signup: ${subjectTarget}`,
    text: [
      "A new Coptic Compass user account has been created.",
      "",
      `Profile ID: ${record.id}`,
      `Email: ${record.email ?? "Not provided"}`,
      `Full name: ${record.fullName ?? "Not provided"}`,
      `Created at: ${record.createdAt ?? "Unknown timestamp"}`,
    ].join("\n"),
  };
}

/**
 * Shapes the non-sensitive notification payload stored alongside the signup
 * alert event.
 */
export function buildProfileSignupNotificationPayload(
  record: ProfileSignupRecord,
) {
  return {
    created_at: record.createdAt,
    profile_email: redactEmailAddress(record.email),
    profile_full_name: record.fullName,
  };
}

/**
 * Returns the deterministic dedupe key used to avoid double-sending signup
 * owner alerts for the same profile.
 */
export function buildProfileSignupNotificationDedupeKey(
  record: ProfileSignupRecord,
) {
  return `profile_signup:${record.id}`;
}
