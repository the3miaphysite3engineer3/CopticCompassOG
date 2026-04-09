import type { TranslationKey } from "@/lib/i18n";
import type { Tables } from "@/types/supabase";

type ContactInquiryOption = {
  value: string;
  labelKey: TranslationKey;
  emailLabel: string;
};

/**
 * Declares the supported contact inquiry categories used by the form, email
 * notifications, and admin filters.
 */
export const contactInquiryOptions = [
  {
    value: "dictionary_feedback",
    labelKey: "contact.option.dictionary",
    emailLabel: "Dictionary Feedback",
  },
  {
    value: "grammar_question",
    labelKey: "contact.option.grammar",
    emailLabel: "Grammar / Linguistics Question",
  },
  {
    value: "research_collaboration",
    labelKey: "contact.option.research",
    emailLabel: "Research Collaboration",
  },
  {
    value: "publication_inquiry",
    labelKey: "contact.option.publication",
    emailLabel: "Publication / Book Inquiry",
  },
  {
    value: "general_message",
    labelKey: "contact.option.general",
    emailLabel: "General Message",
  },
] as const satisfies readonly ContactInquiryOption[];

export type ContactInquiryValue =
  (typeof contactInquiryOptions)[number]["value"];

/**
 * Lists the contact-message workflow states used in admin triage.
 */
export const CONTACT_MESSAGE_STATUSES = [
  "new",
  "in_progress",
  "answered",
  "archived",
] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];
export type ContactMessageRow = Tables<"contact_messages">;

const contactInquiryMap = new Map<string, string>(
  contactInquiryOptions.map((option) => [option.value, option.emailLabel]),
);
const contactMessageStatusLabelMap: Record<ContactMessageStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  answered: "Answered",
  archived: "Archived",
};
const contactMessageStatusPriority: Record<ContactMessageStatus, number> = {
  new: 0,
  in_progress: 1,
  answered: 2,
  archived: 3,
};

/**
 * Narrows a raw inquiry value to one of the supported contact inquiry types.
 */
export function isContactInquiryValue(
  value: string,
): value is ContactInquiryValue {
  return contactInquiryMap.has(value);
}

/**
 * Returns the email-facing label for a validated contact inquiry value.
 */
export function getContactInquiryLabel(value: ContactInquiryValue) {
  return contactInquiryMap.get(value) ?? "General Message";
}

/**
 * Returns the email-facing label for any inquiry value, falling back to the
 * general-message label for unknown values.
 */
export function formatContactInquiryLabel(value: string) {
  return contactInquiryMap.get(value) ?? "General Message";
}

/**
 * Narrows a raw status string to one of the supported contact message states.
 */
export function isContactMessageStatus(
  value: string,
): value is ContactMessageStatus {
  return CONTACT_MESSAGE_STATUSES.includes(value as ContactMessageStatus);
}

/**
 * Returns the admin-facing label for a contact message status.
 */
export function formatContactMessageStatus(status: ContactMessageStatus) {
  return contactMessageStatusLabelMap[status];
}

/**
 * Sorts contact messages by workflow priority first and then by newest first.
 */
export function compareContactMessagePriority(
  left: Pick<ContactMessageRow, "created_at" | "status">,
  right: Pick<ContactMessageRow, "created_at" | "status">,
) {
  return (
    contactMessageStatusPriority[left.status] -
      contactMessageStatusPriority[right.status] ||
    right.created_at.localeCompare(left.created_at)
  );
}
