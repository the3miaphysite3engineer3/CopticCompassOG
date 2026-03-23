"use client";

import type { GrammarLessonIndexItem } from "@/content/grammar/schema";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { getLocalizedHomePath } from "@/lib/locale";
import { GrammarLessonCard } from "./GrammarLessonCard";

type GrammarHubPageClientProps = {
  lessons: GrammarLessonIndexItem[];
};

export default function GrammarHubPageClient({
  lessons,
}: GrammarHubPageClientProps) {
  const { language, t } = useLanguage();

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 md:p-10"
      contentClassName="max-w-5xl w-full space-y-12 pt-10"
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrb,
      ]}
    >
      <BreadcrumbTrail
        items={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.grammar") },
        ]}
      />

      <PageHeader
        title={t("grammar.title")}
        description={t("grammar.subtitle")}
        tone="sky"
      />

        <div className="grid grid-cols-1 gap-6 mx-auto max-w-5xl w-full md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <GrammarLessonCard
              key={lesson.slug}
              lesson={lesson}
              language={language}
              t={t}
            />
          ))}
        </div>
    </PageShell>
  );
}
