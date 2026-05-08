"use client";

import { AppPageIntro } from "@/components/AppPageIntro";
import { useLanguage } from "@/components/LanguageProvider";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import type { GrammarLessonIndexItem } from "@/content/grammar/schema";
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
      className="app-page-shell"
      contentClassName="app-page-content"
      width="standard"
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrb,
      ]}
    >
      <AppPageIntro
        align="center"
        breadcrumbs={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.grammar") },
        ]}
        description={t("grammar.subtitle")}
        title={t("grammar.title")}
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
