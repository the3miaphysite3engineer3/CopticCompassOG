import { describe, expect, it } from "vitest";
import { getGrammarLessonBundleBySlug } from "./grammarDataset";
import {
  buildGrammarLearnerDashboardStats,
  buildGrammarLessonLearnerSummary,
} from "./grammarLearnerState";

describe("grammar learner-state helpers", () => {
  it("builds progress, bookmark, and note summaries from canonical lesson data", () => {
    const lessonBundle = getGrammarLessonBundleBySlug("lesson-1");

    expect(lessonBundle).not.toBeNull();

    const summary = buildGrammarLessonLearnerSummary({
      lessonBundle: lessonBundle!,
      lessonProgressRows: [
        {
          user_id: "user-1",
          lesson_id: "grammar.lesson.01",
          lesson_slug: "lesson-1",
          started_at: "2026-03-22T08:00:00.000Z",
          last_viewed_at: "2026-03-22T09:00:00.000Z",
          completed_at: null,
        },
      ],
      sectionProgressRows: [
        {
          user_id: "user-1",
          lesson_id: "grammar.lesson.01",
          lesson_slug: "lesson-1",
          section_id: "grammar.lesson.01.section.definitions",
          section_slug: "definitions",
          completed_at: "2026-03-22T08:15:00.000Z",
        },
        {
          user_id: "user-1",
          lesson_id: "grammar.lesson.01",
          lesson_slug: "lesson-1",
          section_id: "grammar.lesson.01.section.significant-letters",
          section_slug: "significant-letters",
          completed_at: "2026-03-22T08:45:00.000Z",
        },
      ],
      bookmarkRows: [
        {
          user_id: "user-1",
          lesson_id: "grammar.lesson.01",
          lesson_slug: "lesson-1",
          created_at: "2026-03-22T08:10:00.000Z",
        },
      ],
      lessonNoteRows: [
        {
          user_id: "user-1",
          lesson_id: "grammar.lesson.01",
          lesson_slug: "lesson-1",
          note_text: "Review the significant letters table again.",
          created_at: "2026-03-22T08:20:00.000Z",
          updated_at: "2026-03-22T09:10:00.000Z",
        },
      ],
    });

    expect(summary).toMatchObject({
      lessonId: "grammar.lesson.01",
      lessonSlug: "lesson-1",
      totalSections: 9,
      completedSections: 2,
      progressPercent: 22,
      isStarted: true,
      isCompleted: false,
      isBookmarked: true,
      hasNotes: true,
      nextSectionId: "grammar.lesson.01.section.vocabulary-bare-nouns",
    });
  });

  it("aggregates dashboard stats from lesson summaries", () => {
    const stats = buildGrammarLearnerDashboardStats([
      {
        lessonId: "grammar.lesson.01",
        lessonSlug: "lesson-1",
        lessonNumber: 1,
        lessonTitle: { en: "Lesson 01", nl: "Les 01" },
        totalSections: 9,
        completedSections: 9,
        progressPercent: 100,
        isStarted: true,
        isCompleted: true,
        isBookmarked: true,
        hasNotes: true,
        startedAt: "2026-03-22T08:00:00.000Z",
        lastViewedAt: "2026-03-22T09:00:00.000Z",
        completedAt: "2026-03-22T09:15:00.000Z",
        noteUpdatedAt: "2026-03-22T09:10:00.000Z",
        nextSectionId: null,
        nextSectionTitle: null,
      },
      {
        lessonId: "grammar.lesson.02",
        lessonSlug: "lesson-2",
        lessonNumber: 2,
        lessonTitle: { en: "Lesson 02", nl: "Les 02" },
        totalSections: 0,
        completedSections: 0,
        progressPercent: 0,
        isStarted: false,
        isCompleted: false,
        isBookmarked: false,
        hasNotes: false,
        startedAt: null,
        lastViewedAt: null,
        completedAt: null,
        noteUpdatedAt: null,
        nextSectionId: null,
        nextSectionTitle: null,
      },
    ]);

    expect(stats).toEqual({
      totalLessons: 2,
      startedLessons: 1,
      completedLessons: 1,
      bookmarkedLessons: 1,
      notedLessons: 1,
    });
  });
});
