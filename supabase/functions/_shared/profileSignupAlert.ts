export type DatabaseWebhookPayload<RecordType = Record<string, unknown>> = {
  old_record?: RecordType | null;
  record?: RecordType | null;
  schema?: string;
  table?: string;
  type?: string;
};

export type ProfileSignupRecord = {
  createdAt: string | null;
  email: string | null;
  fullName: string | null;
  id: string;
};

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

export function parseProfileSignupPayload(payload: unknown): ProfileSignupRecord | null {
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

export function buildProfileSignupOwnerAlert(record: ProfileSignupRecord) {
  const subjectTarget = record.email ?? record.fullName ?? record.id;

  return {
    subject: `New user signup: ${subjectTarget}`,
    text: [
      "A new user account has been created.",
      "",
      `Profile ID: ${record.id}`,
      `Email: ${record.email ?? "Not provided"}`,
      `Full name: ${record.fullName ?? "Not provided"}`,
      `Created at: ${record.createdAt ?? "Unknown timestamp"}`,
    ].join("\n"),
  };
}

export function buildProfileSignupNotificationPayload(
  record: ProfileSignupRecord,
) {
  return {
    created_at: record.createdAt,
    profile_email: record.email,
    profile_full_name: record.fullName,
  };
}

export function buildProfileSignupNotificationDedupeKey(
  record: ProfileSignupRecord,
) {
  return `profile_signup:${record.id}`;
}
