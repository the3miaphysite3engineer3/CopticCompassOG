import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

/**
 * Database row aliases used by the learner-state and persistence helpers for
 * grammar bookmarks, notes, and progress.
 */
export type LessonBookmarkRow = Tables<"lesson_bookmarks">;
type _LessonBookmarkInsert = TablesInsert<"lesson_bookmarks">;
type _LessonBookmarkUpdate = TablesUpdate<"lesson_bookmarks">;

export type LessonNoteRow = Tables<"lesson_notes">;
type _LessonNoteInsert = TablesInsert<"lesson_notes">;
type _LessonNoteUpdate = TablesUpdate<"lesson_notes">;

export type LessonProgressRow = Tables<"lesson_progress">;
type _LessonProgressInsert = TablesInsert<"lesson_progress">;
type _LessonProgressUpdate = TablesUpdate<"lesson_progress">;

export type SectionProgressRow = Tables<"section_progress">;
type _SectionProgressInsert = TablesInsert<"section_progress">;
type _SectionProgressUpdate = TablesUpdate<"section_progress">;
