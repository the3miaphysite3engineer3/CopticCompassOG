"use server";

import * as React from "react";
import {
  AudienceOptInConfirmationEmail,
  getAudienceOptInConfirmationSubject,
} from "@/features/communications/components/AudienceOptInConfirmationEmail";
import { ContactEmailTemplate } from "@/features/contact/components/ContactEmailTemplate";
import {
  getContactInquiryLabel,
  isContactInquiryValue,
} from "@/features/contact/lib/contact";
import {
  buildAudienceOptInConfirmationUrl,
  createAudienceOptInRequest,
} from "@/lib/communications/optInRequests";
import { dispatchLoggedNotificationEmail } from "@/lib/notifications/events";
import {
  consumeRateLimit,
  getClientRateLimitIdentifier,
} from "@/lib/rateLimit";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/config";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import {
  getFormLanguage,
  getFormString,
  hasLengthInRange,
  isValidEmail,
  normalizeMultiline,
  normalizeWhitespace,
} from "@/lib/validation";
import type { Language } from "@/types/i18n";

export type ContactFormState = {
  error?: string;
  message?: string;
  success: boolean;
};

const CONTACT_ACTION_COPY: Record<
  Language,
  {
    invalid: string;
    rateLimited: string;
    storageUnavailable: string;
    success: string;
    successConfirmation: string;
    successConfirmationIssue: string;
    submitFailed: string;
  }
> = {
  en: {
    invalid: "Please complete all fields with valid values.",
    rateLimited:
      "Too many messages were sent from this connection. Please wait a few minutes and try again.",
    storageUnavailable: "Contact form storage is not configured yet.",
    success: "Message sent successfully. I'll reply soon!",
    successConfirmation:
      "Message sent successfully. Check your inbox to confirm update emails.",
    successConfirmationIssue:
      "Message sent successfully, but I could not send the update confirmation email just now.",
    submitFailed: "Failed to send message. Please try again.",
  },
  nl: {
    invalid: "Vul alle velden correct in.",
    rateLimited:
      "Er zijn te veel berichten verzonden vanaf deze verbinding. Wacht even en probeer het opnieuw.",
    storageUnavailable: "De contactopslag is nog niet geconfigureerd.",
    success: "Bericht succesvol verzonden. Ik antwoord binnenkort!",
    successConfirmation:
      "Bericht succesvol verzonden. Controleer je inbox om e-mailupdates te bevestigen.",
    successConfirmationIssue:
      "Bericht succesvol verzonden, maar ik kon de bevestigingsmail voor updates nu niet versturen.",
    submitFailed:
      "Je bericht kon nu niet worden verzonden. Probeer het opnieuw.",
  },
};

export async function sendContactEmail(
  _prevState: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  const language = getFormLanguage(formData);
  const copy = CONTACT_ACTION_COPY[language];
  const name = normalizeWhitespace(getFormString(formData, "name"));
  const email = normalizeWhitespace(
    getFormString(formData, "email"),
  ).toLowerCase();
  const inquiryType = normalizeWhitespace(
    getFormString(formData, "inquiryType"),
  );
  const message = normalizeMultiline(getFormString(formData, "message"));
  const honeypot = normalizeWhitespace(getFormString(formData, "website"));
  const wantsUpdates = formData.has("wants_updates");

  if (honeypot) {
    return { success: true };
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return { success: false, error: copy.storageUnavailable };
  }

  if (
    !hasLengthInRange(name, { min: 1, max: 100 }) ||
    !isValidEmail(email) ||
    !isContactInquiryValue(inquiryType) ||
    !hasLengthInRange(message, { min: 5, max: 5000 })
  ) {
    return {
      success: false,
      error: copy.invalid,
    };
  }

  const clientIdentifier = await getClientRateLimitIdentifier();
  const contactRateLimit = await consumeRateLimit({
    identifier: clientIdentifier,
    limit: 3,
    namespace: "contact",
    windowMs: 15 * 60 * 1000,
  });

  if (!contactRateLimit.ok) {
    return {
      success: false,
      error: copy.rateLimited,
    };
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: contactMessage, error } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email,
        inquiry_type: inquiryType,
        message,
        locale: language,
        wants_updates: wantsUpdates,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to store contact message", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });

      if (isMissingSupabaseTableError(error)) {
        return { success: false, error: copy.storageUnavailable };
      }

      return { success: false, error: copy.submitFailed };
    }

    const inquiryLabel = getContactInquiryLabel(inquiryType);
    if (process.env.CONTACT_EMAIL && contactMessage) {
      const notificationResult = await dispatchLoggedNotificationEmail({
        aggregateId: contactMessage.id,
        aggregateType: "contact_message",
        eventType: "contact_message_received",
        payload: {
          inquiry_type: inquiryType,
          locale: language,
          sender_email: email,
          wants_updates: wantsUpdates,
        },
        to: process.env.CONTACT_EMAIL,
        replyTo: email,
        subject: `New Contact: ${inquiryLabel} from ${name}`,
        react: React.createElement(ContactEmailTemplate, {
          name,
          email,
          inquiryLabel,
          message,
        }),
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Type: ${inquiryLabel}`,
          `Locale: ${language}`,
          `Wants updates: ${wantsUpdates ? "yes" : "no"}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      });

      if (!notificationResult.success) {
        console.error("Failed to send contact alert email", {
          contactMessageId: contactMessage.id,
          error: notificationResult.error,
          email,
          inquiryType,
        });
      }
    }

    let successMessage = copy.success;

    if (wantsUpdates) {
      try {
        const { request, token } = await createAudienceOptInRequest({
          booksRequested: true,
          email,
          fullName: name,
          generalUpdatesRequested: true,
          lessonsRequested: true,
          locale: language,
          source: "contact_form",
        });

        const confirmationUrl = buildAudienceOptInConfirmationUrl(
          language,
          token,
        );
        const confirmationResult = await dispatchLoggedNotificationEmail({
          aggregateId: request.id,
          aggregateType: "audience_opt_in_request",
          eventType: "audience_opt_in_requested",
          payload: {
            email,
            locale: language,
            source: "contact_form",
            topics: {
              books: true,
              general_updates: true,
              lessons: true,
            },
          },
          to: email,
          subject: getAudienceOptInConfirmationSubject(language),
          react: React.createElement(AudienceOptInConfirmationEmail, {
            confirmationUrl,
            language,
            recipientName: name,
          }),
          text: [
            language === "nl"
              ? "Bevestig je e-mailupdates via deze link:"
              : "Confirm your email updates with this link:",
            confirmationUrl,
            "",
            language === "nl"
              ? "Heb je dit niet aangevraagd, dan kun je deze e-mail gerust negeren."
              : "If you did not request this, you can safely ignore this email.",
          ].join("\n"),
        });

        successMessage = confirmationResult.success
          ? copy.successConfirmation
          : copy.successConfirmationIssue;

        if (!confirmationResult.success) {
          console.error("Failed to send audience opt-in confirmation email", {
            audienceOptInRequestId: request.id,
            email,
            error: confirmationResult.error,
            locale: language,
          });
        }
      } catch (error) {
        console.error(
          "Failed to create audience opt-in request from contact form",
          {
            email,
            error,
            name,
          },
        );
        successMessage = copy.successConfirmationIssue;
      }
    }

    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    console.error("Failed to handle contact message", error);
    return { success: false, error: copy.submitFailed };
  }
}
