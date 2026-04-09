import { SubmissionEmptyState } from "@/features/submissions/components/SubmissionEmptyState";
import type { SubmissionRow } from "@/features/submissions/types";
import type { Language } from "@/types/i18n";

import { DashboardRecentExerciseDisclosure } from "./DashboardRecentExerciseDisclosure";
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

      {submissions.map((submission, index) => (
        <DashboardRecentExerciseDisclosure
          key={submission.id}
          defaultOpen={index === 0}
          locale={locale}
          submission={submission}
        />
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
