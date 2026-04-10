import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/Badge";
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
import { SubmissionReviewForm } from "@/features/submissions/components/SubmissionReviewForm";
import { SubmissionStatusBadge } from "@/features/submissions/components/SubmissionStatusBadge";
import type { AdminSubmission } from "@/features/submissions/types";
import {
  formatLessonSlug,
  formatSubmissionDate,
} from "@/features/submissions/utils";
import { cx } from "@/lib/classes";
import { antinoou } from "@/lib/fonts";
import { getEntryPath } from "@/lib/locale";

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
          <span className="group-open:hidden">Review</span>
          <span className="hidden group-open:inline">Collapse</span>
          <ChevronDown className="mt-1 h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-stone-200/80 px-6 pb-6 pt-6 dark:border-stone-800 md:px-7 md:pb-7">
        {children}
      </div>
    </details>
  );
}

function _AdminSubmissionDisclosure({
  defaultOpen = false,
  submission,
}: {
  defaultOpen?: boolean;
  submission: AdminSubmission;
}) {
  return (
    <AdminItemDisclosure
      defaultOpen={defaultOpen}
      badges={
        submission.status === "reviewed" ? (
          <SubmissionStatusBadge
            label={
              submission.rating ? `Graded · ${submission.rating}/5` : "Graded"
            }
            tone="reviewed"
          />
        ) : (
          <SubmissionStatusBadge label="Needs Review" tone="pending" />
        )
      }
      title={formatLessonSlug(submission.lesson_slug)}
      metadata={
        <>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            Student: {submission.studentEmail || "Unknown user"}
          </span>
          <span>
            Submitted on {formatSubmissionDate(submission.created_at, "en")}
          </span>
        </>
      }
      preview={buildPreview(submission.submitted_text)}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 whitespace-pre-wrap font-coptic text-lg text-stone-700 dark:border-stone-800/50 dark:bg-stone-950 dark:text-stone-300 md:text-xl">
          {submission.submitted_text}
        </div>

        <SubmissionReviewForm submission={submission} />
      </div>
    </AdminItemDisclosure>
  );
}

function formatLocaleLabel(locale: ContactMessageRow["locale"]) {
  return locale === "nl" ? "Dutch" : "English";
}

export function AdminContactMessageDisclosure({
  defaultOpen = false,
  message,
}: {
  defaultOpen?: boolean;
  message: ContactMessageRow;
}) {
  return (
    <AdminItemDisclosure
      defaultOpen={defaultOpen}
      badges={
        <>
          <ContactMessageStatusBadge status={message.status} />
          <Badge tone="surface" size="xs">
            {formatContactInquiryLabel(message.inquiry_type)}
          </Badge>
          <Badge tone="neutral" size="xs">
            {formatLocaleLabel(message.locale)}
          </Badge>
          {message.wants_updates ? (
            <Badge tone="coptic" size="xs">
              Wants updates
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
            Received on{" "}
            {formatSubmissionDate(message.created_at, message.locale)}
          </span>
          {message.responded_at ? (
            <span>
              Answered on{" "}
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
            Reply by email or update the inbox status once you have handled the
            conversation.
          </p>
          <a href={`mailto:${message.email}`} className="btn-secondary px-5">
            Reply by email
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
  const { entry, report } = reportWithEntry;
  const meaningPreview = entry?.english_meanings.slice(0, 2).join("; ") ?? null;

  return (
    <AdminItemDisclosure
      defaultOpen={defaultOpen}
      badges={
        <>
          <EntryReportStatusBadge status={report.status} />
          <Badge tone="surface" size="xs">
            {formatEntryReportReason(report.reason)}
          </Badge>
        </>
      }
      title={report.entry_headword}
      titleClassName={`${antinoou.className} tracking-wide text-sky-700 dark:text-sky-300`}
      metadata={
        <>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            Reporter:{" "}
            {report.reporterName ?? report.reporterEmail ?? "Unknown user"}
          </span>
          <span>
            Submitted on {formatSubmissionDate(report.created_at, "en")}
          </span>
          <span>Entry ID: {report.entry_id}</span>
        </>
      }
      preview={buildPreview(report.commentary)}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {meaningPreview ? (
              <span>Current meaning: {meaningPreview}</span>
            ) : (
              <span>
                This entry is no longer present in the current published
                dictionary data.
              </span>
            )}
          </div>

          <Link
            href={getEntryPath(report.entry_id, "en")}
            className="btn-secondary px-5"
          >
            Open entry
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
