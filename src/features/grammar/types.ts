import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type LessonBookmarkRow = Tables<"lesson_bookmarks">;
export type LessonBookmarkInsert = TablesInsert<"lesson_bookmarks">;
export type LessonBookmarkUpdate = TablesUpdate<"lesson_bookmarks">;

export type LessonNoteRow = Tables<"lesson_notes">;
export type LessonNoteInsert = TablesInsert<"lesson_notes">;
export type LessonNoteUpdate = TablesUpdate<"lesson_notes">;

export type LessonProgressRow = Tables<"lesson_progress">;
export type LessonProgressInsert = TablesInsert<"lesson_progress">;
export type LessonProgressUpdate = TablesUpdate<"lesson_progress">;

export type SectionProgressRow = Tables<"section_progress">;
export type SectionProgressInsert = TablesInsert<"section_progress">;
export type SectionProgressUpdate = TablesUpdate<"section_progress">;
