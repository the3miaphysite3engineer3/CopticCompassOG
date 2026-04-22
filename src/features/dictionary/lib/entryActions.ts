import type { LexicalEntry } from "@/features/dictionary/types";
import type { Language } from "@/types/i18n";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export const ENTRY_REPORT_REASONS = [
  "typo",
  "translation",
  "grammar",
  "relation",
  "other",
] as const;

export type EntryReportReason = (typeof ENTRY_REPORT_REASONS)[number];
export const ENTRY_REPORT_STATUSES = [
  "open",
  "reviewed",
  "resolved",
  "dismissed",
] as const;
export type EntryReportStatus = (typeof ENTRY_REPORT_STATUSES)[number];

export const ENTRY_REPORT_MIN_COMMENTARY_LENGTH = 10;
export const ENTRY_REPORT_MAX_COMMENTARY_LENGTH = 5000;

export const ENTRY_FAVORITE_ERROR_CODES = [
  "load-failed",
  "not-configured",
  "unavailable",
  "update-failed",
] as const;

export type EntryFavoriteErrorCode =
  (typeof ENTRY_FAVORITE_ERROR_CODES)[number];

/**
 * Narrows a raw report reason value to one of the supported dictionary report
 * categories.
 */
export function isEntryReportReason(value: string): value is EntryReportReason {
  return ENTRY_REPORT_REASONS.includes(value as EntryReportReason);
}

/**
 * Narrows a raw report status value to one of the supported admin workflow
 * states.
 */
export function isEntryReportStatus(value: string): value is EntryReportStatus {
  return ENTRY_REPORT_STATUSES.includes(value as EntryReportStatus);
}

export type EntryFavoriteRow = Tables<"entry_favorites">;
export type EntryFavoriteInsert = TablesInsert<"entry_favorites">;
type _EntryFavoriteUpdate = TablesUpdate<"entry_favorites">;
export type EntryFavoriteWithEntry = {
  entry: LexicalEntry | null;
  favorite: EntryFavoriteRow;
};

export type EntryReportRow = Tables<"entry_reports">;
export type EntryReportInsert = TablesInsert<"entry_reports">;
type _EntryReportUpdate = TablesUpdate<"entry_reports">;
export type AdminEntryReport = EntryReportRow & {
  reporterEmail: string | null;
  reporterName: string | null;
};
export type EntryReportWithEntry = {
  entry: LexicalEntry | null;
  report: AdminEntryReport;
};

const ENTRY_REPORT_REASON_LABELS = {
  en: {
    typo: "Typo or spelling issue",
    translation: "Translation issue",
    grammar: "Grammar issue",
    relation: "Wrong relation or grouping",
    other: "Other",
  },
  nl: {
    typo: "Type- of spelfout",
    translation: "Vertaalprobleem",
    grammar: "Grammaticaal probleem",
    relation: "Verkeerde relatie of groepering",
    other: "Overig",
  },
} as const satisfies Record<Language, Record<EntryReportReason, string>>;

const ENTRY_REPORT_STATUS_LABELS = {
  en: {
    open: "Open",
    reviewed: "Reviewed",
    resolved: "Resolved",
    dismissed: "Dismissed",
  },
  nl: {
    open: "Open",
    reviewed: "Beoordeeld",
    resolved: "Opgelost",
    dismissed: "Afgewezen",
  },
} as const satisfies Record<Language, Record<EntryReportStatus, string>>;

/**
 * Returns the user-facing label for a validated entry report reason.
 */
export function formatEntryReportReason(
  reason: EntryReportReason,
  language: Language = "en",
) {
  return ENTRY_REPORT_REASON_LABELS[language][reason];
}

/**
 * Returns the admin-facing label for a validated entry report status.
 */
export function formatEntryReportStatus(
  status: EntryReportStatus,
  language: Language = "en",
) {
  return ENTRY_REPORT_STATUS_LABELS[language][status];
}

const ENTRY_REPORT_STATUS_PRIORITY: Record<EntryReportStatus, number> = {
  open: 0,
  reviewed: 1,
  resolved: 2,
  dismissed: 3,
};

/**
 * Sorts entry reports by workflow priority first and then by newest first.
 */
export function compareEntryReportPriority(
  left: { created_at: string; status: EntryReportStatus },
  right: { created_at: string; status: EntryReportStatus },
) {
  return (
    ENTRY_REPORT_STATUS_PRIORITY[left.status] -
      ENTRY_REPORT_STATUS_PRIORITY[right.status] ||
    right.created_at.localeCompare(left.created_at)
  );
}
