import { SubmissionCard } from "@/features/submissions/components/SubmissionCard";
import { SubmissionEmptyState } from "@/features/submissions/components/SubmissionEmptyState";
import { SubmissionFeedbackPanel } from "@/features/submissions/components/SubmissionFeedbackPanel";
import { SubmissionStatusBadge } from "@/features/submissions/components/SubmissionStatusBadge";
import type { SubmissionRow } from "@/features/submissions/types";
import type { Language } from "@/types/i18n";
import { getDashboardCopy } from "../lib/dashboardCopy";

export function DashboardRecentExercisesSection({
  locale,
  submissions,
}: {
  locale: Language;
  submissions: readonly SubmissionRow[];
}) {
  const copy = getDashboardCopy(locale);

  return (
    <section className="space-y-8">
      <h3 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-200">
        {copy.recentExercisesTitle}
      </h3>

      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          language={locale}
          submission={submission}
          topRight={
            submission.status === "reviewed" ? (
              <SubmissionStatusBadge
                label={copy.reviewedLabel}
                tone="reviewed"
                className="absolute right-0 top-0 rounded-none rounded-bl-xl px-4 py-1.5 text-white dark:text-emerald-200"
              />
            ) : undefined
          }
        >
          <SubmissionFeedbackPanel language={locale} submission={submission} />
        </SubmissionCard>
      ))}

      {submissions.length === 0 ? (
        <SubmissionEmptyState
          title={copy.noExercisesTitle}
          description={copy.noExercisesDescription}
        />
      ) : null}
    </section>
  );
}
