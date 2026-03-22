import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GrammarLessonPageClient } from "@/features/grammar/components/GrammarLessonPageClient";
import { getPublishedGrammarLessonBundleBySlug } from "@/features/grammar/lib/grammarDataset";
import { createPageMetadata } from "@/lib/metadata";

const lessonBundle = getPublishedGrammarLessonBundleBySlug("lesson-1");

export const metadata: Metadata = createPageMetadata({
  title: lessonBundle ? `Coptic Grammar ${lessonBundle.lesson.title.en}` : "Coptic Grammar Lesson",
  description: lessonBundle?.lesson.summary.en
    ?? "Interactive Coptic grammar lesson with structured notes, exercises, and study aids.",
  path: "/grammar/lesson-1",
});

export default function GrammarPage() {
  if (!lessonBundle) {
    notFound();
  }

  return <GrammarLessonPageClient lessonBundle={lessonBundle} />;
}
