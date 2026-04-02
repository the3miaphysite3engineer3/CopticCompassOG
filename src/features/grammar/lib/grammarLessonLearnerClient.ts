"use client";

import type {
  GrammarLessonDocument,
  GrammarSectionDocument,
} from "@/content/grammar/schema";
import type {
  LessonBookmarkRow,
  LessonNoteRow,
  LessonProgressRow,
  SectionProgressRow,
} from "@/features/grammar/types";
import {
  isMissingSupabaseTableError,
  type SupabaseLikeError,
} from "@/lib/supabase/errors";
import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";

type GrammarLessonMutationResult<T> = {
  data: T | null;
  errorMessage: string | null;
  isUnavailable: boolean;
};

type GrammarLessonReference = Pick<
  GrammarLessonDocument,
  "id" | "sectionOrder" | "slug"
>;

export type GrammarLessonLearnerRecords = {
  bookmark: LessonBookmarkRow | null;
  lessonNote: LessonNoteRow | null;
  lessonProgress: LessonProgressRow | null;
  sectionProgressRows: SectionProgressRow[];
};

export function createEmptyGrammarLessonLearnerRecords(): GrammarLessonLearnerRecords {
  return {
    bookmark: null,
    lessonNote: null,
    lessonProgress: null,
    sectionProgressRows: [],
  };
}

export function resolveGrammarLessonPersistenceError(
  error: SupabaseLikeError,
  fallbackMessage: string,
) {
  if (isMissingSupabaseTableError(error)) {
    return {
      errorMessage: null,
      isUnavailable: true,
    };
  }

  return {
    errorMessage: fallbackMessage,
    isUnavailable: false,
  };
}

export function getLessonCompletionTimestamp({
  completedSections,
  currentCompletedAt,
  totalSections,
}: {
  completedSections: number;
  currentCompletedAt: string | null;
  totalSections: number;
}) {
  if (totalSections === 0 || completedSections !== totalSections) {
    return null;
  }

  return currentCompletedAt ?? new Date().toISOString();
}

export function removeSectionProgressRow(
  rows: readonly SectionProgressRow[],
  sectionId: string,
) {
  return rows.filter((row) => row.section_id !== sectionId);
}

export function upsertSectionProgressRow(
  rows: readonly SectionProgressRow[],
  nextRow: SectionProgressRow,
) {
  return [
    ...rows.filter((row) => row.section_id !== nextRow.section_id),
    nextRow,
  ];
}

export async function loadGrammarLessonLearnerRecords(
  supabase: AppSupabaseClient,
  userId: string,
  lessonId: string,
): Promise<{
  errorMessage: string | null;
  isUnavailable: boolean;
  records: GrammarLessonLearnerRecords;
}> {
  const [
    lessonProgressResult,
    sectionProgressResult,
    bookmarkResult,
    noteResult,
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
    supabase
      .from("section_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("lesson_bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
    supabase
      .from("lesson_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
  ]);

  const errors = [
    lessonProgressResult.error,
    sectionProgressResult.error,
    bookmarkResult.error,
    noteResult.error,
  ].filter((error) => error !== null);

  if (errors.some((error) => isMissingSupabaseTableError(error))) {
    return {
      errorMessage: null,
      isUnavailable: true,
      records: createEmptyGrammarLessonLearnerRecords(),
    };
  }

  return {
    errorMessage:
      errors.length > 0 ? "Could not load your saved lesson state." : null,
    isUnavailable: false,
    records: {
      bookmark: bookmarkResult.data ?? null,
      lessonNote: noteResult.data ?? null,
      lessonProgress: lessonProgressResult.data ?? null,
      sectionProgressRows: sectionProgressResult.data ?? [],
    },
  };
}

export async function syncGrammarLessonProgress(
  supabase: AppSupabaseClient,
  {
    completedSections,
    currentCompletedAt,
    lesson,
    userId,
  }: {
    completedSections: number;
    currentCompletedAt: string | null;
    lesson: GrammarLessonReference;
    userId: string;
  },
): Promise<GrammarLessonMutationResult<LessonProgressRow>> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        completed_at: getLessonCompletionTimestamp({
          completedSections,
          currentCompletedAt,
          totalSections: lesson.sectionOrder.length,
        }),
        last_viewed_at: new Date().toISOString(),
        lesson_id: lesson.id,
        lesson_slug: lesson.slug,
        user_id: userId,
      },
      { onConflict: "user_id,lesson_id" },
    )
    .select("*")
    .maybeSingle();

  if (error) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not sync lesson progress right now.",
      ),
    };
  }

  return {
    data: data ?? null,
    errorMessage: null,
    isUnavailable: false,
  };
}

export async function deleteGrammarLessonBookmark(
  supabase: AppSupabaseClient,
  userId: string,
  lessonId: string,
): Promise<GrammarLessonMutationResult<null>> {
  const { error } = await supabase
    .from("lesson_bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);

  if (error) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not update your bookmark right now.",
      ),
    };
  }

  return {
    data: null,
    errorMessage: null,
    isUnavailable: false,
  };
}

export async function saveGrammarLessonBookmark(
  supabase: AppSupabaseClient,
  userId: string,
  lesson: Pick<GrammarLessonDocument, "id" | "slug">,
): Promise<GrammarLessonMutationResult<LessonBookmarkRow>> {
  const { data, error } = await supabase
    .from("lesson_bookmarks")
    .upsert(
      {
        lesson_id: lesson.id,
        lesson_slug: lesson.slug,
        user_id: userId,
      },
      { onConflict: "user_id,lesson_id" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not update your bookmark right now.",
      ),
    };
  }

  return {
    data,
    errorMessage: null,
    isUnavailable: false,
  };
}

export async function deleteGrammarSectionProgress(
  supabase: AppSupabaseClient,
  userId: string,
  sectionId: string,
): Promise<GrammarLessonMutationResult<null>> {
  const { error } = await supabase
    .from("section_progress")
    .delete()
    .eq("user_id", userId)
    .eq("section_id", sectionId);

  if (error) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not update your section progress right now.",
      ),
    };
  }

  return {
    data: null,
    errorMessage: null,
    isUnavailable: false,
  };
}

export async function saveGrammarSectionProgress(
  supabase: AppSupabaseClient,
  userId: string,
  lesson: Pick<GrammarLessonDocument, "id" | "slug">,
  section: Pick<GrammarSectionDocument, "id" | "slug">,
): Promise<GrammarLessonMutationResult<SectionProgressRow>> {
  const { data, error } = await supabase
    .from("section_progress")
    .upsert(
      {
        completed_at: new Date().toISOString(),
        lesson_id: lesson.id,
        lesson_slug: lesson.slug,
        section_id: section.id,
        section_slug: section.slug,
        user_id: userId,
      },
      { onConflict: "user_id,section_id" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not update your section progress right now.",
      ),
    };
  }

  return {
    data,
    errorMessage: null,
    isUnavailable: false,
  };
}

export async function deleteGrammarLessonNote(
  supabase: AppSupabaseClient,
  userId: string,
  lessonId: string,
): Promise<GrammarLessonMutationResult<null>> {
  const { error } = await supabase
    .from("lesson_notes")
    .delete()
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);

  if (error) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not save your lesson note right now.",
      ),
    };
  }

  return {
    data: null,
    errorMessage: null,
    isUnavailable: false,
  };
}

export async function saveGrammarLessonNote(
  supabase: AppSupabaseClient,
  userId: string,
  lesson: Pick<GrammarLessonDocument, "id" | "slug">,
  noteText: string,
): Promise<GrammarLessonMutationResult<LessonNoteRow>> {
  const { data, error } = await supabase
    .from("lesson_notes")
    .upsert(
      {
        lesson_id: lesson.id,
        lesson_slug: lesson.slug,
        note_text: noteText,
        updated_at: new Date().toISOString(),
        user_id: userId,
      },
      { onConflict: "user_id,lesson_id" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return {
      data: null,
      ...resolveGrammarLessonPersistenceError(
        error,
        "Could not save your lesson note right now.",
      ),
    };
  }

  return {
    data,
    errorMessage: null,
    isUnavailable: false,
  };
}
