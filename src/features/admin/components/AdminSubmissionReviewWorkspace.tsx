"use client";

import { startTransition, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { deleteSubmission } from "@/actions/admin";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import { SubmissionReviewForm } from "@/features/submissions/components/SubmissionReviewForm";
import { SubmissionStatusBadge } from "@/features/submissions/components/SubmissionStatusBadge";
import type { AdminSubmission } from "@/features/submissions/types";
import {
  formatLessonSlug,
  formatSubmissionDate,
} from "@/features/submissions/utils";
import { cx } from "@/lib/classes";

function buildPreview(text: string, maxLength = 160) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function buildSubmissionHref(
  pathname: string,
  searchParamsString: string,
  submissionId: string,
) {
  const nextParams = new URLSearchParams(searchParamsString);
  nextParams.set("submission", submissionId);
  const nextQuery = nextParams.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function AdminSubmissionQueueItem({
  active,
  onSelect,
  submission,
}: {
  active: boolean;
  onSelect: () => void;
  submission: AdminSubmission;
}) {
  const preview = buildPreview(submission.submitted_text);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cx(
        surfacePanelClassName({
          rounded: "3xl",
          variant: active ? "elevated" : "subtle",
          className:
            "w-full p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50",
        }),
        active
          ? "border-sky-200/90 bg-sky-50/90 shadow-lg shadow-sky-100/40 dark:border-sky-900/50 dark:bg-sky-950/30 dark:shadow-black/20"
          : "hover:border-stone-300 hover:bg-white/80 dark:hover:border-stone-700 dark:hover:bg-stone-900/70",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            {submission.status === "reviewed" ? (
              <SubmissionStatusBadge
                label={
                  submission.rating
                    ? `Graded · ${submission.rating}/5`
                    : "Graded"
                }
                tone="reviewed"
              />
            ) : (
              <SubmissionStatusBadge label="Needs Review" tone="pending" />
            )}
          </div>

          <h3 className="mt-3 text-lg font-semibold text-stone-950 dark:text-stone-50">
            {formatLessonSlug(submission.lesson_slug)}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-medium text-stone-800 dark:text-stone-200">
              Student: {submission.studentEmail || "Unknown user"}
            </span>
            <span>
              Submitted on {formatSubmissionDate(submission.created_at, "en")}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
            {preview}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1 text-sm font-medium text-stone-500 dark:text-stone-400">
          <span className="hidden sm:inline">{active ? "Open" : "Review"}</span>
          <ChevronRight
            className={cx(
              "h-5 w-5 transition-transform duration-200",
              active ? "translate-x-0.5 text-sky-600 dark:text-sky-300" : "",
            )}
          />
        </div>
      </div>
    </button>
  );
}

function AdminSubmissionReviewPanel({
  submission,
}: {
  submission: AdminSubmission | null;
}) {
  if (!submission) {
    return (
      <div
        className={surfacePanelClassName({
          rounded: "3xl",
          variant: "subtle",
          className:
            "flex min-h-[20rem] items-center justify-center p-8 text-center",
        })}
      >
        <div className="space-y-3">
          <Badge tone="surface" size="xs" caps>
            Review Panel
          </Badge>
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Select a submission to review.
          </p>
          <p className="max-w-sm text-sm leading-6 text-stone-600 dark:text-stone-400">
            The queue stays compact on the left while the full submission and
            grading form stay focused here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={surfacePanelClassName({
        rounded: "3xl",
        variant: "elevated",
        shadow: "float",
        className:
          "overflow-hidden xl:max-h-[calc(100vh-8.5rem)] xl:overflow-y-auto",
      })}
    >
      <div className="border-b border-stone-200/80 px-6 py-5 dark:border-stone-800 md:px-7">
        <div className="flex flex-wrap gap-2">
          {submission.status === "reviewed" ? (
            <SubmissionStatusBadge
              label={
                submission.rating ? `Graded · ${submission.rating}/5` : "Graded"
              }
              tone="reviewed"
            />
          ) : (
            <SubmissionStatusBadge label="Needs Review" tone="pending" />
          )}
          <Badge tone="surface" size="xs">
            {submission.studentEmail || "Unknown user"}
          </Badge>
        </div>

        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
          {formatLessonSlug(submission.lesson_slug)}
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          Submitted on {formatSubmissionDate(submission.created_at, "en")}
        </p>
      </div>

      <div className="space-y-6 px-6 py-6 md:px-7">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 whitespace-pre-wrap font-coptic text-lg text-stone-700 dark:border-stone-800/50 dark:bg-stone-950 dark:text-stone-300 md:text-xl">
          {submission.submitted_text}
        </div>

        <SubmissionReviewForm submission={submission} />

        <form
          action={deleteSubmission}
          className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-5 dark:border-rose-900/40 dark:bg-rose-950/20"
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Remove this submission from the student and admin views? Use this for accidental duplicates or test submissions.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="submission_id" value={submission.id} />
          <input
            type="hidden"
            name="lesson_slug"
            value={submission.lesson_slug}
          />
          <input
            type="hidden"
            name="deletion_reason"
            value="duplicate_submission"
          />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                Remove duplicate or test submission
              </p>
              <p className="text-sm leading-6 text-rose-700 dark:text-rose-200">
                This is a soft delete: the row stays in the database for audit
                purposes, but it disappears from the student dashboard and the
                instructor queues.
              </p>
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50"
            >
              Remove submission
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminSubmissionReviewWorkspace({
  submissions,
}: {
  submissions: AdminSubmission[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const searchParamSelection = searchParams.get("submission");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedSubmission =
    submissions.find((submission) => submission.id === searchParamSelection) ??
    submissions[0] ??
    null;

  function handleSelect(submissionId: string) {
    startTransition(() => {
      router.replace(
        buildSubmissionHref(pathname, searchParamsString, submissionId),
        { scroll: false },
      );
    });

    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      window.requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-stone-200/80 bg-stone-50/80 p-4 text-sm leading-6 text-stone-600 dark:border-stone-800 dark:bg-stone-950/40 dark:text-stone-400">
        Keep the queue compact on the left, then review and score the selected
        submission in a focused panel without expanding every card inline.
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(22rem,30rem)]">
        <div className="space-y-3">
          {submissions.map((submission) => (
            <AdminSubmissionQueueItem
              key={submission.id}
              active={submission.id === selectedSubmission?.id}
              onSelect={() => handleSelect(submission.id)}
              submission={submission}
            />
          ))}
        </div>

        <div ref={panelRef} className="xl:sticky xl:top-28 xl:self-start">
          <AdminSubmissionReviewPanel submission={selectedSubmission} />
        </div>
      </div>
    </div>
  );
}
