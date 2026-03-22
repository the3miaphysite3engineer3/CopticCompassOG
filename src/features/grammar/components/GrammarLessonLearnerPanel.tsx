"use client";

import Link from "next/link";
import { Bookmark, CheckCircle2, NotebookPen } from "lucide-react";
import { Badge } from "@/components/Badge";
import { StatusNotice } from "@/components/StatusNotice";
import { cx } from "@/lib/classes";
import type { Language } from "@/types/i18n";
import type { GrammarLessonLearnerSummary } from "@/features/grammar/lib/grammarLearnerState";

type GrammarLessonLearnerPanelProps = {
  errorMessage: string | null;
  isBookmarkPending: boolean;
  language: Language;
  onToggleBookmark: () => Promise<void>;
  status: "loading" | "ready" | "signed-out" | "unavailable";
  summary: GrammarLessonLearnerSummary;
};

type GrammarLessonNotesPanelProps = {
  errorMessage: string | null;
  hasUnsavedNoteChanges: boolean;
  isNotePending: boolean;
  language: Language;
  noteText: string;
  noteUpdatedAt: string | null;
  onSaveNote: () => Promise<void>;
  onNoteChange: (value: string) => void;
  status: "loading" | "ready" | "signed-out" | "unavailable";
};

function formatProgressLabel(
  language: Language,
  summary: GrammarLessonLearnerSummary,
) {
  if (language === "nl") {
    return `${summary.completedSections} van ${summary.totalSections} paragrafen afgerond`;
  }

  return `${summary.completedSections} of ${summary.totalSections} sections completed`;
}

function formatSavedDate(language: Language, value: string | null) {
  if (!value) {
    return null;
  }

  const formatted = new Date(value).toLocaleDateString();
  return language === "nl"
    ? `Laatst bijgewerkt op ${formatted}`
    : `Last updated on ${formatted}`;
}

export function GrammarLessonLearnerPanel({
  errorMessage,
  isBookmarkPending,
  language,
  onToggleBookmark,
  status,
  summary,
}: GrammarLessonLearnerPanelProps) {
  if (status === "unavailable") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="h-44 animate-pulse rounded-2xl border border-stone-200/90 bg-white/70 shadow-sm dark:border-stone-800/90 dark:bg-stone-950/40" />
    );
  }

  if (status === "signed-out") {
    return (
      <StatusNotice
        tone="info"
        size="comfortable"
        actions={
          <Link href="/login" className="btn-primary px-5">
            {language === "nl" ? "Aanmelden" : "Sign in"}
          </Link>
        }
      >
        {language === "nl"
          ? "Meld je aan om je voortgang, bladwijzers en lesnotities op te slaan."
          : "Sign in to save your progress, bookmarks, and lesson notes."}
      </StatusNotice>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white/70 shadow-sm backdrop-blur-sm dark:border-stone-800/90 dark:bg-stone-950/40">
      <div className="border-b border-stone-200/80 px-5 py-4 dark:border-stone-800/80">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {language === "nl" ? "Studietracking" : "Study tracking"}
        </p>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {language === "nl" ? "Jouw voortgang" : "Your progress"}
          </h2>
          {summary.isCompleted ? (
            <Badge tone="accent" size="xs">
              {language === "nl" ? "Voltooid" : "Completed"}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-stone-700 dark:text-stone-300">
              {formatProgressLabel(language, summary)}
            </span>
            <span className="font-semibold text-sky-700 dark:text-sky-300">
              {summary.progressPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {summary.isStarted ? (
            <Badge tone="surface" size="xs">
              {language === "nl" ? "Gestart" : "Started"}
            </Badge>
          ) : null}
          {summary.isBookmarked ? (
            <Badge tone="surface" size="xs">
              {language === "nl" ? "Opgeslagen" : "Saved"}
            </Badge>
          ) : null}
          {summary.hasNotes ? (
            <Badge tone="surface" size="xs">
              {language === "nl" ? "Met notities" : "Has notes"}
            </Badge>
          ) : null}
        </div>

        {summary.lastViewedAt ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {language === "nl"
              ? `Laatst geopend op ${new Date(summary.lastViewedAt).toLocaleDateString()}`
              : `Last opened on ${new Date(summary.lastViewedAt).toLocaleDateString()}`}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void onToggleBookmark();
            }}
            disabled={isBookmarkPending}
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              summary.isBookmarked
                ? "bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
                : "border border-stone-200 bg-white/80 text-stone-700 hover:border-sky-200 hover:text-sky-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:border-sky-900/70 dark:hover:text-sky-300",
            )}
          >
            <Bookmark className="h-4 w-4" />
            {summary.isBookmarked
              ? language === "nl"
                ? "Opgeslagen"
                : "Saved"
              : language === "nl"
                ? "Les opslaan"
                : "Save lesson"}
          </button>
          <Link href="/dashboard" className="btn-secondary px-4 py-2 text-sm">
            {language === "nl" ? "Dashboard" : "Dashboard"}
          </Link>
        </div>

        {errorMessage ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function GrammarLessonSectionProgressButton({
  isCompleted,
  isPending,
  language,
  onToggle,
}: {
  isCompleted: boolean;
  isPending: boolean;
  language: Language;
  onToggle: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void onToggle();
      }}
      disabled={isPending}
      className={cx(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
        isCompleted
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
          : "border border-stone-200 bg-white/80 text-stone-700 hover:border-sky-200 hover:text-sky-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:border-sky-900/70 dark:hover:text-sky-300",
      )}
    >
      <CheckCircle2 className="h-4 w-4" />
      {isCompleted
        ? language === "nl"
          ? "Paragraaf voltooid"
          : "Section completed"
        : language === "nl"
          ? "Markeer als voltooid"
          : "Mark as completed"}
    </button>
  );
}

export function GrammarLessonNotesPanel({
  errorMessage,
  hasUnsavedNoteChanges,
  isNotePending,
  language,
  noteText,
  noteUpdatedAt,
  onSaveNote,
  onNoteChange,
  status,
}: GrammarLessonNotesPanelProps) {
  if (status !== "ready") {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white/70 shadow-sm backdrop-blur-sm dark:border-stone-800/90 dark:bg-stone-950/40">
      <div className="border-b border-stone-200/80 px-6 py-5 dark:border-stone-800/80">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <NotebookPen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {language === "nl" ? "Persoonlijk" : "Personal"}
            </p>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              {language === "nl" ? "Lesnotities" : "Lesson notes"}
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
          {language === "nl"
            ? "Bewaar hier je eigen aantekeningen bij deze les. Ze blijven gekoppeld aan dit les-ID in je dashboard."
            : "Keep your own notes for this lesson here. They stay attached to this lesson id in your dashboard."}
        </p>

        <textarea
          value={noteText}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={6}
          className="input-base min-h-[10rem] w-full resize-y px-4 py-3 text-base font-sans"
          placeholder={
            language === "nl"
              ? "Schrijf hier je samenvatting, vragen of geheugensteuntjes..."
              : "Write your summary, questions, or memory aids here..."
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {formatSavedDate(language, noteUpdatedAt) ??
              (language === "nl"
                ? "Nog geen notities opgeslagen"
                : "No saved notes yet")}
          </p>
          <button
            type="button"
            onClick={() => {
              void onSaveNote();
            }}
            disabled={isNotePending || !hasUnsavedNoteChanges}
            className="btn-primary px-5"
          >
            {isNotePending
              ? language === "nl"
                ? "Opslaan..."
                : "Saving..."
              : language === "nl"
                ? "Notities opslaan"
                : "Save notes"}
          </button>
        </div>

        {errorMessage ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
