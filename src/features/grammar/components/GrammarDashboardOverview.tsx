import Link from "next/link";
import { Badge } from "@/components/Badge";
import { SurfacePanel } from "@/components/SurfacePanel";
import {
  formatDashboardDate,
  getDashboardCopy,
} from "@/features/dashboard/lib/dashboardCopy";
import {
  buildGrammarLearnerDashboardStats,
  type GrammarLessonLearnerSummary,
} from "@/features/grammar/lib/grammarLearnerState";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import type { Language } from "@/types/i18n";

type GrammarDashboardOverviewProps = {
  language: Language;
  lessonSummaries: readonly GrammarLessonLearnerSummary[];
};

export function GrammarDashboardOverview({
  language,
  lessonSummaries,
}: GrammarDashboardOverviewProps) {
  const stats = buildGrammarLearnerDashboardStats(lessonSummaries);
  const copy = getDashboardCopy(language);

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-200">
          {copy.grammar.title}
        </h3>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {copy.grammar.description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [copy.grammar.publishedLessons, stats.totalLessons],
          [copy.grammar.startedLessons, stats.startedLessons],
          [copy.grammar.completedLessons, stats.completedLessons],
          [
            copy.grammar.savedLessons,
            stats.bookmarkedLessons + stats.notedLessons,
          ],
        ].map(([label, value]) => (
          <SurfacePanel key={label} rounded="2xl" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-stone-900 dark:text-stone-100">
              {value}
            </p>
          </SurfacePanel>
        ))}
      </div>

      <div className="grid gap-4">
        {lessonSummaries.map((summary) => {
          const lessonHref = summary.nextSectionId
            ? `${getGrammarLessonPath(summary.lessonSlug, language)}#${summary.nextSectionId}`
            : getGrammarLessonPath(summary.lessonSlug, language);

          return (
            <SurfacePanel
              key={summary.lessonId}
              rounded="3xl"
              className="p-6 md:p-7"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge tone="accent" size="xs">
                      {String(summary.lessonNumber).padStart(2, "0")}
                    </Badge>
                    {summary.isCompleted ? (
                      <Badge tone="surface" size="xs">
                        {copy.grammar.completedBadge}
                      </Badge>
                    ) : null}
                    {summary.isBookmarked ? (
                      <Badge tone="surface" size="xs">
                        {copy.grammar.savedBadge}
                      </Badge>
                    ) : null}
                    {summary.hasNotes ? (
                      <Badge tone="surface" size="xs">
                        {copy.grammar.notesBadge}
                      </Badge>
                    ) : null}
                  </div>

                  <h4 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                    {summary.lessonTitle[language]}
                  </h4>

                  <div className="mt-4 max-w-xl">
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {language === "nl"
                          ? `${summary.completedSections} van ${summary.totalSections} onderdelen voltooid`
                          : `${summary.completedSections} of ${summary.totalSections} sections complete`}
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

                  <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
                    {summary.lastViewedAt
                      ? language === "nl"
                        ? `Laatst bekeken op ${formatDashboardDate(summary.lastViewedAt, language)}`
                        : `Last visited on ${formatDashboardDate(summary.lastViewedAt, language)}`
                      : copy.grammar.notStartedYet}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                  {summary.nextSectionTitle ? (
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {language === "nl" ? "Volgende:" : "Next up:"}{" "}
                      {summary.nextSectionTitle[language]}
                    </p>
                  ) : null}
                  <Link href={lessonHref} className="btn-primary px-5">
                    {summary.isStarted
                      ? copy.grammar.continueLesson
                      : copy.grammar.startLesson}
                  </Link>
                </div>
              </div>
            </SurfacePanel>
          );
        })}
      </div>
    </section>
  );
}
