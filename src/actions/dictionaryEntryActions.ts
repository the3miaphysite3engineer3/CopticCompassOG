"use server";

import { getDictionaryEntryById } from "@/features/dictionary/lib/dictionary";
import {
  ENTRY_REPORT_MAX_COMMENTARY_LENGTH,
  ENTRY_REPORT_MIN_COMMENTARY_LENGTH,
  isEntryReportReason,
  type EntryReportInsert,
} from "@/features/dictionary/lib/entryActions";
import { dispatchLoggedOwnerAlertEmail } from "@/lib/notifications/events";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import { consumeRateLimit, getUserRateLimitIdentifier } from "@/lib/rateLimit";
import { getEntryPath } from "@/lib/locale";
import { getFormString, hasLengthInRange, normalizeMultiline, normalizeWhitespace } from "@/lib/validation";
import { isLanguage, type Language } from "@/lib/i18n";

export type EntryReportActionState =
  | {
      message?: string;
      success?: boolean;
      error?: string;
    }
  | null;

const ENTRY_REPORT_COPY: Record<
  Language,
  {
    authRequired: string;
    invalid: string;
    rateLimited: string;
    storageUnavailable: string;
    submitFailed: string;
    success: string;
  }
> = {
  en: {
    authRequired: "Please sign in before reporting an entry.",
    invalid: "Please choose a reason and include a short explanation.",
    rateLimited: "Too many reports were sent recently. Please wait a bit before submitting another one.",
    storageUnavailable: "Entry reports are not configured yet.",
    submitFailed: "Could not submit your report right now. Please try again.",
    success: "Thanks. Your report was submitted successfully.",
  },
  nl: {
    authRequired: "Meld je eerst aan voordat je een lemma meldt.",
    invalid: "Kies een reden en voeg een korte toelichting toe.",
    rateLimited: "Er zijn onlangs te veel meldingen verzonden. Wacht even voordat je opnieuw iets indient.",
    storageUnavailable: "Het melden van lemma's is nog niet geconfigureerd.",
    submitFailed: "Je melding kon nu niet worden verzonden. Probeer het opnieuw.",
    success: "Bedankt. Je melding is succesvol verzonden.",
  },
};

function getActionLanguage(formData: FormData) {
  const rawLanguage = normalizeWhitespace(getFormString(formData, "language"));
  return isLanguage(rawLanguage) ? rawLanguage : "en";
}

function isMissingEntryReportTableError(
  error: { code?: string; message?: string } | null | undefined,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("Could not find the table") === true ||
    error.message?.includes("relation") === true
  );
}

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

  return dispatchLoggedOwnerAlertEmail({
    aggregateId,
    aggregateType: "entry_report",
    eventType: "dictionary_entry_report_submitted",
    payload: {
      entry_id: entryId,
      locale,
      reason,
      reporter_email: userEmail ?? null,
    },
    subject: `Dictionary entry report: ${entryHeadword} (${entryId})`,
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

export async function submitEntryReport(
  _prevState: EntryReportActionState,
  formData: FormData,
): Promise<EntryReportActionState> {
  const language = getActionLanguage(formData);
  const copy = ENTRY_REPORT_COPY[language];

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
  const entryId = normalizeWhitespace(getFormString(formData, "entryId"));
  const reason = normalizeWhitespace(getFormString(formData, "reason"));
  const commentary = normalizeMultiline(getFormString(formData, "commentary"));
  const entry = getDictionaryEntryById(entryId);

  if (
    !entry ||
    !isEntryReportReason(reason) ||
    !hasLengthInRange(commentary, {
      min: ENTRY_REPORT_MIN_COMMENTARY_LENGTH,
      max: ENTRY_REPORT_MAX_COMMENTARY_LENGTH,
    })
  ) {
    return {
      success: false,
      error: copy.invalid,
    };
  }

  const reportRateLimit = await consumeRateLimit({
    identifier: getUserRateLimitIdentifier(user.id),
    limit: 5,
    namespace: `entry-report:${entry.id}`,
    windowMs: 60 * 60 * 1000,
  });

  if (!reportRateLimit.ok) {
    return {
      success: false,
      error: copy.rateLimited,
    };
  }

  const reportPayload: EntryReportInsert = {
    commentary,
    entry_headword: entry.headword,
    entry_id: entry.id,
    reason,
    status: "open",
    user_id: user.id,
  };

  const { data: report, error } = await supabase
    .from("entry_reports")
    .insert(reportPayload)
    .select("id")
    .single();

  if (error) {
    console.error("Failed to submit dictionary entry report", {
      code: error.code,
      details: error.details,
      entryId,
      hint: error.hint,
      message: error.message,
      userId: user.id,
    });

    if (isMissingEntryReportTableError(error)) {
      return {
        success: false,
        error: copy.storageUnavailable,
      };
    }

    return {
      success: false,
      error: copy.submitFailed,
    };
  }

  try {
    if (report) {
      const notificationResult = await sendEntryReportNotificationEmail({
        aggregateId: report.id,
        commentary,
        entryHeadword: entry.headword,
        entryId: entry.id,
        locale: language,
        reason,
        userEmail: user.email,
      });

      if (!notificationResult.success) {
        console.error("Failed to send dictionary entry report notification", {
          entryId: entry.id,
          error: notificationResult.error,
          reportId: report.id,
          userId: user.id,
        });
      }
    }
  } catch (notificationError) {
    console.error("Failed to send dictionary entry report notification", notificationError);
  }

  return {
    message: copy.success,
    success: true,
  };
}
