"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { cx } from "@/lib/classes";

import {
  formatEntryReportStatus,
  type EntryReportStatus,
} from "../lib/entryActions";

type EntryReportStatusBadgeProps = {
  className?: string;
  status: EntryReportStatus;
};

const STATUS_CLASSES: Record<EntryReportStatus, string> = {
  open: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300",
  reviewed:
    "border-accent/25 bg-accent-soft text-accent-strong dark:text-accent",
  resolved: "border-coptic/20 bg-coptic-soft text-coptic",
  dismissed:
    "border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export function EntryReportStatusBadge({
  className,
  status,
}: EntryReportStatusBadgeProps) {
  const { language } = useLanguage();

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {formatEntryReportStatus(status, language)}
    </span>
  );
}
