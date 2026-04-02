import type { GrammarLessonBundle } from "@/content/grammar/schema";
import type {
  LessonBookmarkRow,
  LessonNoteRow,
  LessonProgressRow,
  SectionProgressRow,
} from "@/features/grammar/types";

export type GrammarLessonLearnerSummary = {
  lessonId: string;
  lessonSlug: string;
  lessonNumber: number;
  lessonTitle: GrammarLessonBundle["lesson"]["title"];
  totalSections: number;
  completedSections: number;
  progressPercent: number;
  isStarted: boolean;
  isCompleted: boolean;
  isBookmarked: boolean;
  hasNotes: boolean;
  startedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
  noteUpdatedAt: string | null;
  nextSectionId: string | null;
  nextSectionTitle:
    | GrammarLessonBundle["lesson"]["sections"][number]["title"]
    | null;
};

export type GrammarLearnerDashboardStats = {
  totalLessons: number;
  startedLessons: number;
  completedLessons: number;
  bookmarkedLessons: number;
  notedLessons: number;
};

type GrammarLessonLearnerRows = {
  bookmarkRows: readonly LessonBookmarkRow[];
  lessonBundle: GrammarLessonBundle;
  lessonNoteRows: readonly LessonNoteRow[];
  lessonProgressRows: readonly LessonProgressRow[];
  sectionProgressRows: readonly SectionProgressRow[];
};

export function buildGrammarLessonLearnerSummary({
  bookmarkRows,
  lessonBundle,
  lessonNoteRows,
  lessonProgressRows,
  sectionProgressRows,
}: GrammarLessonLearnerRows): GrammarLessonLearnerSummary {
  const lesson = lessonBundle.lesson;
  const lessonProgress =
    lessonProgressRows.find((row) => row.lesson_id === lesson.id) ?? null;
  const lessonBookmark =
    bookmarkRows.find((row) => row.lesson_id === lesson.id) ?? null;
  const lessonNote =
    lessonNoteRows.find((row) => row.lesson_id === lesson.id) ?? null;
  const completedSectionIds = new Set(
    sectionProgressRows
      .filter((row) => row.lesson_id === lesson.id)
      .map((row) => row.section_id),
  );
  const orderedSections = lesson.sectionOrder
    .map(
      (sectionId) =>
        lesson.sections.find((section) => section.id === sectionId) ?? null,
    )
    .filter(
      (section): section is GrammarLessonBundle["lesson"]["sections"][number] =>
        section !== null,
    );
  const completedSections = orderedSections.filter((section) =>
    completedSectionIds.has(section.id),
  ).length;
  const totalSections = orderedSections.length;
  const progressPercent =
    totalSections === 0
      ? 0
      : Math.round((completedSections / totalSections) * 100);
  const nextSection =
    orderedSections.find((section) => !completedSectionIds.has(section.id)) ??
    null;

  return {
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    lessonNumber: lesson.number,
    lessonTitle: lesson.title,
    totalSections,
    completedSections,
    progressPercent,
    isStarted: lessonProgress !== null || completedSections > 0,
    isCompleted: totalSections > 0 && completedSections === totalSections,
    isBookmarked: lessonBookmark !== null,
    hasNotes: lessonNote !== null && lessonNote.note_text.trim().length > 0,
    startedAt: lessonProgress?.started_at ?? null,
    lastViewedAt: lessonProgress?.last_viewed_at ?? null,
    completedAt: lessonProgress?.completed_at ?? null,
    noteUpdatedAt: lessonNote?.updated_at ?? null,
    nextSectionId: nextSection?.id ?? null,
    nextSectionTitle: nextSection?.title ?? null,
  };
}

export function buildGrammarLearnerDashboardStats(
  summaries: readonly GrammarLessonLearnerSummary[],
): GrammarLearnerDashboardStats {
  return {
    totalLessons: summaries.length,
    startedLessons: summaries.filter((summary) => summary.isStarted).length,
    completedLessons: summaries.filter((summary) => summary.isCompleted).length,
    bookmarkedLessons: summaries.filter((summary) => summary.isBookmarked)
      .length,
    notedLessons: summaries.filter((summary) => summary.hasNotes).length,
  };
}
