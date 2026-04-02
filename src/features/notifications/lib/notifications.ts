import type { Json, Tables } from "@/types/supabase";

export type NotificationEventRow = Tables<"notification_events">;
export type NotificationDeliveryRow = Tables<"notification_deliveries">;

export type AdminNotificationEvent = NotificationEventRow & {
  deliveries: NotificationDeliveryRow[];
  latestDelivery: NotificationDeliveryRow | null;
};

function asObject(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function getStringValue(payload: Json, key: string) {
  const record = asObject(payload);
  const value = record?.[key];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNumberValue(payload: Json, key: string) {
  const record = asObject(payload);
  const value = record?.[key];

  return typeof value === "number" ? value : null;
}

export function compareAdminNotificationPriority(
  left: AdminNotificationEvent,
  right: AdminNotificationEvent,
) {
  const statusPriority = {
    failed: 0,
    queued: 1,
    sent: 2,
  } as const;

  const byStatus = statusPriority[left.status] - statusPriority[right.status];
  if (byStatus !== 0) {
    return byStatus;
  }

  return (
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

export function formatNotificationEventType(eventType: string) {
  switch (eventType) {
    case "contact_message_received":
      return "Contact message";
    case "content_release_sent":
      return "Release email";
    case "content_release_broadcast_sent":
      return "Release broadcast";
    case "content_release_test_sent":
      return "Release preview";
    case "dictionary_entry_report_submitted":
      return "Dictionary report";
    case "exercise_submission_received":
      return "Exercise submission";
    case "profile_signup":
      return "User signup";
    case "submission_reviewed":
      return "Feedback ready";
    default:
      return eventType.replace(/_/g, " ");
  }
}

export function formatNotificationAggregateType(aggregateType: string) {
  switch (aggregateType) {
    case "contact_message":
      return "Contact";
    case "content_release":
      return "Content release";
    case "entry_report":
      return "Entry report";
    case "profile":
      return "Profile";
    case "submission":
      return "Submission";
    default:
      return aggregateType.replace(/_/g, " ");
  }
}

export function formatNotificationTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getNotificationContextBadges(event: AdminNotificationEvent) {
  const badges: string[] = [];

  switch (event.event_type) {
    case "contact_message_received": {
      const inquiryType = getStringValue(event.payload, "inquiry_type");
      const senderEmail = getStringValue(event.payload, "sender_email");
      const locale = getStringValue(event.payload, "locale");

      if (inquiryType) {
        badges.push(`Inquiry: ${inquiryType.replace(/_/g, " ")}`);
      }
      if (senderEmail) {
        badges.push(`Sender: ${senderEmail}`);
      }
      if (locale) {
        badges.push(`Locale: ${locale.toUpperCase()}`);
      }
      break;
    }
    case "content_release_sent":
    case "content_release_broadcast_sent":
    case "content_release_test_sent": {
      const audienceSegment = getStringValue(event.payload, "audience_segment");
      const itemCount = getNumberValue(event.payload, "item_count");
      const locale = getStringValue(event.payload, "locale");
      const preview = getStringValue(event.payload, "preview");
      const releaseType = getStringValue(event.payload, "release_type");
      const recipientCount = getNumberValue(event.payload, "recipient_count");
      const segmentId = getStringValue(event.payload, "segment_id");

      if (audienceSegment) {
        badges.push(`Audience: ${audienceSegment.replace(/_/g, " ")}`);
      }
      if (releaseType) {
        badges.push(`Type: ${releaseType.replace(/_/g, " ")}`);
      }
      if (itemCount !== null) {
        badges.push(`Items: ${itemCount}`);
      }
      if (recipientCount !== null) {
        badges.push(`Recipients: ${recipientCount}`);
      }
      if (locale) {
        badges.push(`Locale: ${locale.toUpperCase()}`);
      }
      if (segmentId) {
        badges.push(`Segment: ${segmentId}`);
      }
      if (preview === "true") {
        badges.push("Preview");
      }
      break;
    }
    case "dictionary_entry_report_submitted": {
      const entryId = getStringValue(event.payload, "entry_id");
      const locale = getStringValue(event.payload, "locale");
      const reason = getStringValue(event.payload, "reason");

      if (entryId) {
        badges.push(`Entry: ${entryId}`);
      }
      if (reason) {
        badges.push(`Reason: ${reason.replace(/_/g, " ")}`);
      }
      if (locale) {
        badges.push(`Locale: ${locale.toUpperCase()}`);
      }
      break;
    }
    case "exercise_submission_received": {
      const lessonSlug = getStringValue(event.payload, "lesson_slug");
      const exerciseId = getStringValue(event.payload, "exercise_id");
      const submittedLanguage = getStringValue(
        event.payload,
        "submitted_language",
      );

      if (lessonSlug) {
        badges.push(`Lesson: ${lessonSlug}`);
      }
      if (exerciseId) {
        badges.push(`Exercise: ${exerciseId}`);
      }
      if (submittedLanguage) {
        badges.push(`Language: ${submittedLanguage.toUpperCase()}`);
      }
      break;
    }
    case "submission_reviewed": {
      const lessonSlug = getStringValue(event.payload, "lesson_slug");
      const exerciseId = getStringValue(event.payload, "exercise_id");
      const rating = getNumberValue(event.payload, "rating");

      if (lessonSlug) {
        badges.push(`Lesson: ${lessonSlug}`);
      }
      if (exerciseId) {
        badges.push(`Exercise: ${exerciseId}`);
      }
      if (rating !== null) {
        badges.push(`Rating: ${rating}/5`);
      }
      break;
    }
    case "profile_signup": {
      const profileEmail = getStringValue(event.payload, "profile_email");
      const profileFullName = getStringValue(
        event.payload,
        "profile_full_name",
      );

      if (profileEmail) {
        badges.push(`Email: ${profileEmail}`);
      }
      if (profileFullName) {
        badges.push(`Name: ${profileFullName}`);
      }
      break;
    }
    default:
      break;
  }

  return badges;
}
