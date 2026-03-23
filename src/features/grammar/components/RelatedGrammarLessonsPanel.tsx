import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SurfacePanel } from "@/components/SurfacePanel";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import type { GrammarLessonReference } from "@/features/grammar/lib/grammarContentGraph";
import type { Language } from "@/types/i18n";

type RelatedGrammarLessonsPanelProps = {
  description: string;
  language: Language;
  lessons: readonly GrammarLessonReference[];
  title: string;
};

export function RelatedGrammarLessonsPanel({
  description,
  language,
  lessons,
  title,
}: RelatedGrammarLessonsPanelProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
          {title}
        </h2>
        <p className="text-stone-500 dark:text-stone-400">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={getGrammarLessonPath(lesson.slug, language)}
            className="group"
          >
            <SurfacePanel
              rounded="3xl"
              className="flex h-full flex-col justify-between p-5 transition-colors hover:border-sky-300 dark:hover:border-sky-700"
            >
              <div className="space-y-3">
                <Badge tone="accent" size="xs">
                  {String(lesson.number).padStart(2, "0")}
                </Badge>
                <div>
                  <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                    {lesson.title[language]}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-stone-300">
                    {lesson.summary[language]}
                  </p>
                </div>
              </div>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition-colors group-hover:text-sky-500 dark:text-sky-400 dark:group-hover:text-sky-300">
                {language === "nl" ? "Open les" : "Open lesson"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </SurfacePanel>
          </Link>
        ))}
      </div>
    </section>
  );
}
