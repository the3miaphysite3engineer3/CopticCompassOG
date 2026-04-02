import type { TranslationKey } from "@/lib/i18n";
import type { Tables } from "@/types/supabase";

type ContactInquiryOption = {
  value: string;
  labelKey: TranslationKey;
  emailLabel: string;
};

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

export function isContactInquiryValue(
  value: string,
): value is ContactInquiryValue {
  return contactInquiryMap.has(value);
}

export function getContactInquiryLabel(value: ContactInquiryValue) {
  return contactInquiryMap.get(value) ?? "General Message";
}

export function formatContactInquiryLabel(value: string) {
  return contactInquiryMap.get(value) ?? "General Message";
}

export function isContactMessageStatus(
  value: string,
): value is ContactMessageStatus {
  return CONTACT_MESSAGE_STATUSES.includes(value as ContactMessageStatus);
}

export function formatContactMessageStatus(status: ContactMessageStatus) {
  return contactMessageStatusLabelMap[status];
}

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
