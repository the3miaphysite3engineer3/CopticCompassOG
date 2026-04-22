"use server";

import { getDictionaryEntryById } from "@/features/dictionary/lib/dictionary";
import {
  ENTRY_REPORT_MAX_COMMENTARY_LENGTH,
  ENTRY_REPORT_MIN_COMMENTARY_LENGTH,
  type EntryReportReason,
  isEntryReportReason,
  type EntryReportInsert,
} from "@/features/dictionary/lib/entryActions";
import type { Language } from "@/lib/i18n";
import { getEntryPath } from "@/lib/locale";
import { queueLoggedOwnerAlertEmail } from "@/lib/notifications/events";
import { redactEmailAddress } from "@/lib/privacy";
import {
  consumeRateLimit,
  getUserRateLimitIdentifier,
  hasAvailableRateLimitProtection,
} from "@/lib/rateLimit";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import {
  getFormLanguage,
  getFormString,
  hasLengthInRange,
  normalizeMultiline,
  normalizeWhitespace,
} from "@/lib/validation";

export type EntryReportActionState = {
  message?: string;
  success?: boolean;
  error?: string;
} | null;

const ENTRY_REPORT_COPY: Record<
  Language,
  {
    authRequired: string;
    invalid: string;
    rateLimited: string;
    rateLimitUnavailable: string;
    storageUnavailable: string;
    submitFailed: string;
    success: string;
  }
> = {
  en: {
    authRequired: "Please sign in before reporting an entry.",
    invalid: "Please choose a reason and include a short explanation.",
    rateLimited:
      "Too many reports were sent recently. Please wait a bit before submitting another one.",
    rateLimitUnavailable:
      "Entry reporting is temporarily unavailable. Please try again later.",
    storageUnavailable: "Entry reports are not configured yet.",
    submitFailed: "Could not submit your report right now. Please try again.",
    success: "Thanks. Your report was submitted successfully.",
  },
  nl: {
    authRequired: "Meld u eerst aan voordat u een lemma meldt.",
    invalid: "Kies een reden en voeg een korte toelichting toe.",
    rateLimited:
      "Er zijn onlangs te veel meldingen verzonden. Wacht even voordat u opnieuw iets indient.",
    rateLimitUnavailable:
      "Het melden van lemma's is tijdelijk niet beschikbaar. Probeer het later opnieuw.",
    storageUnavailable: "Het melden van lemma's is nog niet geconfigureerd.",
    submitFailed:
      "Uw melding kon nu niet worden verzonden. Probeer het opnieuw.",
    success: "Bedankt. Uw melding is succesvol verzonden.",
  },
};

/**
 * Builds and sends the owner alert email for a stored entry report, including
 * the resolved entry URL and the reporter's redacted identity details.
 */
async function sendEntryReportNotificationEmail({
  aggregateId,
  commentary,
  entryHeadword,
  entryId,
  locale,
  reason,
  userEmail,
}: {
  aggregateId: string;
  commentary: string;
  entryHeadword: string;
  entryId: string;
  locale: Language;
  reason: string;
  userEmail: string | null | undefined;
}) {
  const siteUrl = getSiteUrl()?.toString() ?? siteConfig.liveUrl;
  const entryPath = getEntryPath(entryId, locale);

  return queueLoggedOwnerAlertEmail({
    aggregateId,
    aggregateType: "entry_report",
    eventType: "dictionary_entry_report_submitted",
    payload: {
      entry_id: entryId,
      locale,
      reason,
      reporter_email: redactEmailAddress(userEmail),
    },
    subject: `Coptic Compass entry report: ${entryHeadword} (${entryId})`,
    text: [
      `Entry: ${entryHeadword}`,
      `Entry ID: ${entryId}`,
      `Locale path: ${entryPath}`,
      `Absolute URL: ${siteUrl}${entryPath}`,
      `Reason: ${reason}`,
      `Reporter: ${userEmail ?? "Unknown email"}`,
      "",
      "Commentary:",
      commentary,
    ].join("\n"),
  });
}

/**
 * Validates the user-supplied commentary length against the configured bounds
 * for dictionary entry reports.
 */
function hasValidEntryReportCommentary(commentary: string) {
  return hasLengthInRange(commentary, {
    min: ENTRY_REPORT_MIN_COMMENTARY_LENGTH,
    max: ENTRY_REPORT_MAX_COMMENTARY_LENGTH,
  });
}

/**
 * Builds the insert payload stored for a new entry report, keeping the current
 * headword snapshot alongside the reported entry id and reason.
 */
function getEntryReportInsertPayload(options: {
  commentary: string;
  entry: NonNullable<ReturnType<typeof getDictionaryEntryById>>;
  reason: EntryReportReason;
  userId: string;
}): EntryReportInsert {
  return {
    commentary: options.commentary,
    entry_headword: options.entry.headword,
    entry_id: options.entry.id,
    reason: options.reason,
    status: "open",
    user_id: options.userId,
  };
}

/**
 * Maps Supabase insert failures to the user-facing entry report states the
 * reporting form understands, including the dedicated storage-not-configured
 * path.
 */
function getEntryReportInsertErrorState(options: {
  copy: (typeof ENTRY_REPORT_COPY)[Language];
  error: {
    code: string | null;
    details: string | null;
    hint: string | null;
    message: string;
  };
  entryId: string;
  userId: string;
}) {
  console.error("Failed to submit dictionary entry report", {
    code: options.error.code,
    details: options.error.details,
    entryId: options.entryId,
    hint: options.error.hint,
    message: options.error.message,
    userId: options.userId,
  });

  if (isMissingSupabaseTableError(options.error)) {
    return {
      success: false,
      error: options.copy.storageUnavailable,
    } satisfies NonNullable<EntryReportActionState>;
  }

  return {
    success: false,
    error: options.copy.submitFailed,
  } satisfies NonNullable<EntryReportActionState>;
}

/**
 * Sends the owner notification for a stored entry report as a best-effort side
 * effect so the reporting action can still succeed when email delivery fails.
 */
async function dispatchEntryReportNotification(options: {
  commentary: string;
  entry: NonNullable<ReturnType<typeof getDictionaryEntryById>>;
  language: Language;
  reason: EntryReportReason;
  reportId: string | null;
  user: {
    email?: string | null;
    id: string;
  };
}) {
  if (!options.reportId) {
    return;
  }

  try {
    const notificationResult = await sendEntryReportNotificationEmail({
      aggregateId: options.reportId,
      commentary: options.commentary,
      entryHeadword: options.entry.headword,
      entryId: options.entry.id,
      locale: options.language,
      reason: options.reason,
      userEmail: options.user.email,
    });

    if (!notificationResult.success) {
      console.error("Failed to send dictionary entry report notification", {
        entryId: options.entry.id,
        error: notificationResult.error,
        reportId: options.reportId,
        userId: options.user.id,
      });
    }
  } catch (notificationError) {
    console.error(
      "Failed to send dictionary entry report notification",
      notificationError,
    );
  }
}

type ParsedEntryReportSubmission = {
  commentary: string;
  copy: (typeof ENTRY_REPORT_COPY)[Language];
  entry: NonNullable<ReturnType<typeof getDictionaryEntryById>>;
  entryId: string;
  language: Language;
  reason: EntryReportReason;
};

/**
 * Parses and validates the submitted report payload before any auth or storage
 * work begins.
 */
function parseEntryReportSubmission(
  formData: FormData,
): { error: EntryReportActionState } | { values: ParsedEntryReportSubmission } {
  const language = getFormLanguage(formData, "language");
  const copy = ENTRY_REPORT_COPY[language];
  const entryId = normalizeWhitespace(getFormString(formData, "entryId"));
  const reason = normalizeWhitespace(getFormString(formData, "reason"));
  const commentary = normalizeMultiline(getFormString(formData, "commentary"));
  const entry = getDictionaryEntryById(entryId);

  if (
    !entry ||
    !isEntryReportReason(reason) ||
    !hasValidEntryReportCommentary(commentary)
  ) {
    return {
      error: {
        success: false,
        error: copy.invalid,
      },
    };
  }

  return {
    values: {
      commentary,
      copy,
      entry,
      entryId,
      language,
      reason,
    },
  };
}

/**
 * Consumes the per-entry report rate limit and returns the translated failure
 * state when the limiter cannot be used or the user has exceeded the quota.
 */
async function getEntryReportRateLimitError(options: {
  copy: (typeof ENTRY_REPORT_COPY)[Language];
  entryId: string;
  userId: string;
}): Promise<EntryReportActionState> {
  if (!hasAvailableRateLimitProtection()) {
    return {
      success: false,
      error: options.copy.rateLimitUnavailable,
    };
  }

  const reportRateLimit = await consumeRateLimit({
    identifier: getUserRateLimitIdentifier(options.userId),
    limit: 5,
    namespace: `entry-report:${options.entryId}`,
    windowMs: 60 * 60 * 1000,
  });

  if (reportRateLimit.ok) {
    return null;
  }

  return {
    success: false,
    error: options.copy.rateLimited,
  };
}

/**
 * Validates and stores one authenticated dictionary entry report, then sends a
 * best-effort owner notification without blocking the success response.
 */
export async function submitEntryReport(
  _prevState: EntryReportActionState,
  formData: FormData,
): Promise<EntryReportActionState> {
  const parseResult = parseEntryReportSubmission(formData);
  if ("error" in parseResult) {
    return parseResult.error;
  }

  const { commentary, copy, entry, entryId, language, reason } =
    parseResult.values;

  if (!hasSupabaseRuntimeEnv()) {
    return {
      success: false,
      error: copy.storageUnavailable,
    };
  }

  const authContext = await getAuthenticatedServerContext();
  if (!authContext) {
    return {
      success: false,
      error: copy.authRequired,
    };
  }

  const { supabase, user } = authContext;
  const rateLimitError = await getEntryReportRateLimitError({
    copy,
    entryId: entry.id,
    userId: user.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const reportPayload = getEntryReportInsertPayload({
    commentary,
    entry,
    reason,
    userId: user.id,
  });

  const { data: report, error } = await supabase
    .from("entry_reports")
    .insert(reportPayload)
    .select("id")
    .single();

  if (error) {
    return getEntryReportInsertErrorState({
      copy,
      entryId,
      error,
      userId: user.id,
    });
  }

  await dispatchEntryReportNotification({
    commentary,
    entry,
    language,
    reason,
    reportId: report?.id ?? null,
    user,
  });

  return {
    message: copy.success,
    success: true,
  };
}
