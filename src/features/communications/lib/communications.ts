import type { Language } from "@/types/i18n";
import type { Tables } from "@/types/supabase";

export type AudienceContactRow = Tables<"audience_contacts">;
export type AudienceContactSyncStateRow = Tables<"audience_contact_sync_state">;
export type AdminAudienceContactRow = AudienceContactRow & {
  syncState: AudienceContactSyncStateRow | null;
};
export type AudiencePreferencesRow = Pick<
  AudienceContactRow,
  | "books_opt_in"
  | "email"
  | "general_updates_opt_in"
  | "id"
  | "lessons_opt_in"
  | "locale"
  | "profile_id"
  | "source"
>;

export type AudiencePreferences = {
  booksOptIn: boolean;
  generalUpdatesOptIn: boolean;
  lessonsOptIn: boolean;
  locale: Language;
};

export function getAudiencePreferences(
  contact:
    | Pick<
        AudienceContactRow,
        "books_opt_in" | "general_updates_opt_in" | "lessons_opt_in" | "locale"
      >
    | null
    | undefined,
  fallbackLocale: Language = "en",
): AudiencePreferences {
  return {
    booksOptIn: contact?.books_opt_in ?? false,
    generalUpdatesOptIn: contact?.general_updates_opt_in ?? false,
    lessonsOptIn: contact?.lessons_opt_in ?? false,
    locale: contact?.locale ?? fallbackLocale,
  };
}

export function hasAudienceSubscriptions(
  contact:
    | Pick<
        AudienceContactRow,
        "books_opt_in" | "general_updates_opt_in" | "lessons_opt_in"
      >
    | AudiencePreferences
    | null
    | undefined,
) {
  if (!contact) {
    return false;
  }

  return Boolean(
    ("booksOptIn" in contact ? contact.booksOptIn : contact.books_opt_in) ||
    ("generalUpdatesOptIn" in contact
      ? contact.generalUpdatesOptIn
      : contact.general_updates_opt_in) ||
    ("lessonsOptIn" in contact ? contact.lessonsOptIn : contact.lessons_opt_in),
  );
}

export function compareAudienceContactPriority(
  left: AudienceContactRow,
  right: AudienceContactRow,
) {
  const leftActive = hasAudienceSubscriptions(left);
  const rightActive = hasAudienceSubscriptions(right);

  if (leftActive !== rightActive) {
    return Number(rightActive) - Number(leftActive);
  }

  return (
    new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  );
}

export function getAudienceSourceLabel(
  source: AudienceContactRow["source"],
  language: Language = "en",
) {
  const labels = {
    contact_form: language === "nl" ? "Contactformulier" : "Contact form",
    dashboard: language === "nl" ? "Dashboard" : "Dashboard",
    signup: language === "nl" ? "Aanmelding" : "Signup",
  } as const satisfies Record<AudienceContactRow["source"], string>;

  return labels[source];
}

export function getAudienceLocaleLabel(
  locale: AudienceContactRow["locale"],
  language: Language = "en",
) {
  if (locale === "nl") {
    return language === "nl" ? "Nederlands" : "Dutch";
  }

  return language === "nl" ? "Engels" : "English";
}
