"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import { ContactMessageReviewForm } from "@/features/contact/components/ContactMessageReviewForm";
import { ContactMessageStatusBadge } from "@/features/contact/components/ContactMessageStatusBadge";
import {
  formatContactInquiryLabel,
  type ContactMessageRow,
} from "@/features/contact/lib/contact";
import { EntryReportReviewForm } from "@/features/dictionary/components/EntryReportReviewForm";
import { EntryReportStatusBadge } from "@/features/dictionary/components/EntryReportStatusBadge";
import {
  formatEntryReportReason,
  type EntryReportWithEntry,
} from "@/features/dictionary/lib/entryActions";
import { formatSubmissionDate } from "@/features/submissions/utils";
import { cx } from "@/lib/classes";
import { antinoou } from "@/lib/fonts";
import { getEntryPath } from "@/lib/locale";
import type { Language } from "@/types/i18n";

const adminItemDisclosureCopy = {
  en: {
    answeredOn: "Answered on",
    collapse: "Collapse",
    currentMeaning: "Current meaning",
    entryId: "Entry ID",
    graded: "Graded",
    locale: {
      en: "English",
      nl: "Dutch",
    },
    missingEntry:
      "This entry is no longer present in the current published dictionary data.",
    needsReview: "Needs Review",
    openEntry: "Open entry",
    receivedOn: "Received on",
    replyByEmail: "Reply by email",
    replyDescription:
      "Reply by email or update the inbox status once you have handled the conversation.",
    reporter: "Reporter",
    review: "Review",
    student: "Student",
    submittedOn: "Submitted on",
    unknownUser: "Unknown user",
    wantsUpdates: "Wants updates",
  },
  nl: {
    answeredOn: "Beantwoord op",
    collapse: "Inklappen",
    currentMeaning: "Huidige betekenis",
    entryId: "Item-ID",
    graded: "Beoordeeld",
    locale: {
      en: "Engels",
      nl: "Nederlands",
    },
    missingEntry:
      "Dit item staat niet meer in de huidige gepubliceerde woordenboekdata.",
    needsReview: "Te beoordelen",
    openEntry: "Item openen",
    receivedOn: "Ontvangen op",
    replyByEmail: "Per e-mail antwoorden",
    replyDescription:
      "Antwoord per e-mail of werk de inboxstatus bij zodra u het gesprek hebt afgehandeld.",
    reporter: "Melder",
    review: "Beoordelen",
    student: "Student",
    submittedOn: "Ingediend op",
    unknownUser: "Onbekende gebruiker",
    wantsUpdates: "Wil updates ontvangen",
  },
} as const;

function buildPreview(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function AdminItemDisclosure({
  badges,
  children,
  defaultOpen = false,
  metadata,
  preview,
  title,
  titleClassName,
}: {
  badges?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  metadata?: React.ReactNode;
  preview?: string | null;
  title: React.ReactNode;
  titleClassName?: string;
}) {
  const { language } = useLanguage();
  const copy = adminItemDisclosureCopy[language];

  return (
    <details
      className={surfacePanelClassName({
        rounded: "3xl",
        variant: "elevated",
        className: "group overflow-hidden",
      })}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden md:p-7">
        <div className="min-w-0 flex-1">
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}

          <h3
            className={cx(
              "mt-3 text-xl font-semibold text-stone-900 dark:text-stone-100 md:text-2xl",
              titleClassName,
            )}
          >
            {title}
          </h3>

          {metadata ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600 dark:text-stone-400">
              {metadata}
            </div>
          ) : null}

          {preview ? (
            <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-600 line-clamp-2 dark:text-stone-400">
              {preview}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-sm font-medium text-stone-500 dark:text-stone-400">
          <span className="group-open:hidden">{copy.review}</span>
          <span className="hidden group-open:inline">{copy.collapse}</span>
          <ChevronDown className="mt-1 h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-stone-200/80 px-6 pb-6 pt-6 dark:border-stone-800 md:px-7 md:pb-7">
        {children}
      </div>
    </details>
  );
}

function formatLocaleLabel(
  locale: ContactMessageRow["locale"],
  language: Language,
) {
  return adminItemDisclosureCopy[language].locale[locale];
}

export function AdminContactMessageDisclosure({
  defaultOpen = false,
  message,
}: {
  defaultOpen?: boolean;
  message: ContactMessageRow;
}) {
  const { language } = useLanguage();
  const copy = adminItemDisclosureCopy[language];

  return (
    <AdminItemDisclosure
      defaultOpen={defaultOpen}
      badges={
        <>
          <ContactMessageStatusBadge status={message.status} />
          <Badge tone="surface" size="xs">
            {formatContactInquiryLabel(message.inquiry_type, language)}
          </Badge>
          <Badge tone="neutral" size="xs">
            {formatLocaleLabel(message.locale, language)}
          </Badge>
          {message.wants_updates ? (
            <Badge tone="coptic" size="xs">
              {copy.wantsUpdates}
            </Badge>
          ) : null}
        </>
      }
      title={message.name}
      metadata={
        <>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {message.email}
          </span>
          <span>
            {copy.receivedOn}{" "}
            {formatSubmissionDate(message.created_at, message.locale)}
          </span>
          {message.responded_at ? (
            <span>
              {copy.answeredOn}{" "}
              {formatSubmissionDate(message.responded_at, message.locale)}
            </span>
          ) : null}
        </>
      }
      preview={buildPreview(message.message)}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {copy.replyDescription}
          </p>
          <a href={`mailto:${message.email}`} className="btn-secondary px-5">
            {copy.replyByEmail}
          </a>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 text-base leading-7 whitespace-pre-wrap text-stone-700 dark:border-stone-800/50 dark:bg-stone-950 dark:text-stone-300">
          {message.message}
        </div>

        <ContactMessageReviewForm
          contactMessageId={message.id}
          status={message.status}
        />
      </div>
    </AdminItemDisclosure>
  );
}

export function AdminEntryReportDisclosure({
  defaultOpen = false,
  reportWithEntry,
}: {
  defaultOpen?: boolean;
  reportWithEntry: EntryReportWithEntry;
}) {
  const { language } = useLanguage();
  const copy = adminItemDisclosureCopy[language];
  const { entry, report } = reportWithEntry;
  const meaningPreview =
    (language === "nl" && entry?.dutch_meanings?.length
      ? entry.dutch_meanings
      : entry?.english_meanings
    )
      ?.slice(0, 2)
      .join("; ") ?? null;

  return (
    <AdminItemDisclosure
      defaultOpen={defaultOpen}
      badges={
        <>
          <EntryReportStatusBadge status={report.status} />
          <Badge tone="surface" size="xs">
            {formatEntryReportReason(report.reason, language)}
          </Badge>
        </>
      }
      title={report.entry_headword}
      titleClassName={`${antinoou.className} tracking-wide text-sky-700 dark:text-sky-300`}
      metadata={
        <>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {copy.reporter}:{" "}
            {report.reporterName ?? report.reporterEmail ?? copy.unknownUser}
          </span>
          <span>
            {copy.submittedOn}{" "}
            {formatSubmissionDate(report.created_at, language)}
          </span>
          <span>
            {copy.entryId}: {report.entry_id}
          </span>
        </>
      }
      preview={buildPreview(report.commentary)}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {meaningPreview ? (
              <span>
                {copy.currentMeaning}: {meaningPreview}
              </span>
            ) : (
              <span>{copy.missingEntry}</span>
            )}
          </div>

          <Link
            href={getEntryPath(report.entry_id, language)}
            className="btn-secondary px-5"
          >
            {copy.openEntry}
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 text-base leading-7 whitespace-pre-wrap text-stone-700 dark:border-stone-800/50 dark:bg-stone-950 dark:text-stone-300">
          {report.commentary}
        </div>

        <EntryReportReviewForm reportId={report.id} status={report.status} />
      </div>
    </AdminItemDisclosure>
  );
}
