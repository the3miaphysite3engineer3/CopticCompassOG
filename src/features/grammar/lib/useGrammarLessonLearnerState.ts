"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { GrammarLessonBundle, GrammarSectionDocument } from "@/content/grammar/schema";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { normalizeMultiline } from "@/lib/validation";
import type {
  LessonBookmarkRow,
  LessonNoteRow,
  LessonProgressRow,
  SectionProgressRow,
} from "@/features/grammar/types";
import {
  buildGrammarLessonLearnerSummary,
  type GrammarLessonLearnerSummary,
} from "./grammarLearnerState";

type GrammarLessonLearnerStatus = "loading" | "ready" | "signed-out" | "unavailable";

type UseGrammarLessonLearnerStateResult = {
  completedSectionIds: string[];
  errorMessage: string | null;
  isBookmarkPending: boolean;
  isNotePending: boolean;
  noteText: string;
  noteUpdatedAt: string | null;
  pendingSectionId: string | null;
  sectionCompletionEnabled: boolean;
  status: GrammarLessonLearnerStatus;
  summary: GrammarLessonLearnerSummary;
  toggleBookmark: () => Promise<void>;
  toggleSectionComplete: (section: GrammarSectionDocument) => Promise<void>;
  saveNote: () => Promise<void>;
  setNoteText: (value: string) => void;
  hasUnsavedNoteChanges: boolean;
};

function isMissingLearnerStateTableError(
  error: { code?: string; message?: string } | null | undefined,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("Could not find the table") === true ||
    error.message?.includes("relation") === true
  );
}

function createEmptySummary(lessonBundle: GrammarLessonBundle) {
  return buildGrammarLessonLearnerSummary({
    lessonBundle,
    lessonProgressRows: [],
    sectionProgressRows: [],
    bookmarkRows: [],
    lessonNoteRows: [],
  });
}

export function useGrammarLessonLearnerState(
  lessonBundle: GrammarLessonBundle,
): UseGrammarLessonLearnerStateResult {
  const supabaseAvailable = hasSupabaseEnv();
  const lessonSectionOrderKey = lessonBundle.lesson.sectionOrder.join("|");
  const lessonSectionCount = lessonBundle.lesson.sectionOrder.length;
  const [status, setStatus] = useState<GrammarLessonLearnerStatus>(
    supabaseAvailable ? "loading" : "unavailable",
  );
  const [user, setUser] = useState<User | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressRow | null>(null);
  const [sectionProgressRows, setSectionProgressRows] = useState<SectionProgressRow[]>([]);
  const [bookmark, setBookmark] = useState<LessonBookmarkRow | null>(null);
  const [lessonNote, setLessonNote] = useState<LessonNoteRow | null>(null);
  const [noteText, setNoteText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [isNotePending, setIsNotePending] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);

  const summary = buildGrammarLessonLearnerSummary({
    lessonBundle,
    lessonProgressRows: lessonProgress ? [lessonProgress] : [],
    sectionProgressRows,
    bookmarkRows: bookmark ? [bookmark] : [],
    lessonNoteRows: lessonNote ? [lessonNote] : [],
  });
  const normalizedNoteText = normalizeMultiline(noteText);
  const savedNoteText = lessonNote?.note_text ?? "";
  const hasUnsavedNoteChanges = normalizedNoteText !== savedNoteText;
  const completedSectionIds = sectionProgressRows.map((row) => row.section_id);

  useEffect(() => {
    if (!supabaseAvailable) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const syncLessonProgress = async (
      currentUserId: string,
      nextCompletedSectionRows: readonly SectionProgressRow[],
      currentCompletedAt: string | null,
    ) => {
      const completedSections = nextCompletedSectionRows.length;
      const nextCompletedAt =
        lessonSectionCount > 0 && completedSections === lessonSectionCount
          ? currentCompletedAt ?? new Date().toISOString()
          : null;

      const { data, error } = await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: currentUserId,
            lesson_id: lessonBundle.lesson.id,
            lesson_slug: lessonBundle.lesson.slug,
            last_viewed_at: new Date().toISOString(),
            completed_at: nextCompletedAt,
          },
          { onConflict: "user_id,lesson_id" },
        )
        .select("*")
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        if (isMissingLearnerStateTableError(error)) {
          setStatus("unavailable");
          setErrorMessage(null);
          return;
        }

        setErrorMessage("Could not sync lesson progress right now.");
        return;
      }

      if (data) {
        setLessonProgress(data);
      }
    };

    const loadLearnerState = async (currentUser: User | null) => {
      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        setUser(null);
        setLessonProgress(null);
        setSectionProgressRows([]);
        setBookmark(null);
        setLessonNote(null);
        setNoteText("");
        setErrorMessage(null);
        setStatus("signed-out");
        return;
      }

      setStatus("loading");
      setUser(currentUser);

      const [lessonProgressResult, sectionProgressResult, bookmarkResult, noteResult] =
        await Promise.all([
          supabase
            .from("lesson_progress")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("lesson_id", lessonBundle.lesson.id)
            .maybeSingle(),
          supabase
            .from("section_progress")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("lesson_id", lessonBundle.lesson.id)
            .order("completed_at", { ascending: false }),
          supabase
            .from("lesson_bookmarks")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("lesson_id", lessonBundle.lesson.id)
            .maybeSingle(),
          supabase
            .from("lesson_notes")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("lesson_id", lessonBundle.lesson.id)
            .maybeSingle(),
        ]);

      if (!isMounted) {
        return;
      }

      const errors = [
        lessonProgressResult.error,
        sectionProgressResult.error,
        bookmarkResult.error,
        noteResult.error,
      ].filter((error) => error !== null);

      if (errors.some((error) => isMissingLearnerStateTableError(error))) {
        setStatus("unavailable");
        setErrorMessage(null);
        return;
      }

      setLessonProgress(lessonProgressResult.data ?? null);
      setSectionProgressRows(sectionProgressResult.data ?? []);
      setBookmark(bookmarkResult.data ?? null);
      setLessonNote(noteResult.data ?? null);
      setNoteText(noteResult.data?.note_text ?? "");
      setErrorMessage(
        errors.length > 0 ? "Could not load your saved lesson state." : null,
      );
      setStatus("ready");

      await syncLessonProgress(
        currentUser.id,
        sectionProgressResult.data ?? [],
        lessonProgressResult.data?.completed_at ?? null,
      );
    };

    void supabase.auth.getUser().then(({ data }) => {
      void loadLearnerState(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadLearnerState(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [
    supabaseAvailable,
    lessonBundle.lesson.id,
    lessonBundle.lesson.slug,
    lessonSectionCount,
    lessonSectionOrderKey,
  ]);

  async function toggleBookmark() {
    if (!user) {
      setStatus("signed-out");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatus("unavailable");
      return;
    }

    setIsBookmarkPending(true);
    setErrorMessage(null);

    if (bookmark) {
      const { error } = await supabase
        .from("lesson_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonBundle.lesson.id);

      if (error) {
        if (isMissingLearnerStateTableError(error)) {
          setStatus("unavailable");
          setErrorMessage(null);
          setIsBookmarkPending(false);
          return;
        }

        setErrorMessage("Could not update your bookmark right now.");
      } else {
        setBookmark(null);
      }

      setIsBookmarkPending(false);
      return;
    }

    const { data, error } = await supabase
      .from("lesson_bookmarks")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonBundle.lesson.id,
          lesson_slug: lessonBundle.lesson.slug,
        },
        { onConflict: "user_id,lesson_id" },
      )
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingLearnerStateTableError(error)) {
        setStatus("unavailable");
        setErrorMessage(null);
        setIsBookmarkPending(false);
        return;
      }

      setErrorMessage("Could not update your bookmark right now.");
    } else if (data) {
      setBookmark(data);
    }

    setIsBookmarkPending(false);
  }

  async function toggleSectionComplete(section: GrammarSectionDocument) {
    if (!user) {
      setStatus("signed-out");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatus("unavailable");
      return;
    }

    setPendingSectionId(section.id);
    setErrorMessage(null);

    const isCompleted = sectionProgressRows.some(
      (row) => row.section_id === section.id,
    );

    if (isCompleted) {
      const { error } = await supabase
        .from("section_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("section_id", section.id);

      if (error) {
        if (isMissingLearnerStateTableError(error)) {
          setStatus("unavailable");
          setErrorMessage(null);
          setPendingSectionId(null);
          return;
        }

        setErrorMessage("Could not update your section progress right now.");
        setPendingSectionId(null);
        return;
      }

      const nextRows = sectionProgressRows.filter(
        (row) => row.section_id !== section.id,
      );
      setSectionProgressRows(nextRows);

      await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonBundle.lesson.id,
            lesson_slug: lessonBundle.lesson.slug,
            last_viewed_at: new Date().toISOString(),
            completed_at: null,
          },
          { onConflict: "user_id,lesson_id" },
        )
        .select("*")
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            if (isMissingLearnerStateTableError(error)) {
              setStatus("unavailable");
              setErrorMessage(null);
              return;
            }

            setErrorMessage("Could not sync lesson progress right now.");
            return;
          }

          if (data) {
            setLessonProgress(data);
          }
        });

      setPendingSectionId(null);
      return;
    }

    const { data, error } = await supabase
      .from("section_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonBundle.lesson.id,
          lesson_slug: lessonBundle.lesson.slug,
          section_id: section.id,
          section_slug: section.slug,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,section_id" },
      )
      .select("*")
      .maybeSingle();

    if (error || !data) {
      if (isMissingLearnerStateTableError(error)) {
        setStatus("unavailable");
        setErrorMessage(null);
        setPendingSectionId(null);
        return;
      }

      setErrorMessage("Could not update your section progress right now.");
      setPendingSectionId(null);
      return;
    }

    const nextRows = [...sectionProgressRows.filter((row) => row.section_id !== section.id), data];
    setSectionProgressRows(nextRows);

    const nextCompletedAt =
      lessonSectionCount > 0 && nextRows.length === lessonSectionCount
        ? lessonProgress?.completed_at ?? new Date().toISOString()
        : null;

    const lessonProgressResult = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonBundle.lesson.id,
          lesson_slug: lessonBundle.lesson.slug,
          last_viewed_at: new Date().toISOString(),
          completed_at: nextCompletedAt,
        },
        { onConflict: "user_id,lesson_id" },
      )
      .select("*")
      .maybeSingle();

    if (lessonProgressResult.error) {
      if (isMissingLearnerStateTableError(lessonProgressResult.error)) {
        setStatus("unavailable");
        setErrorMessage(null);
        setPendingSectionId(null);
        return;
      }

      setErrorMessage("Could not sync lesson progress right now.");
    } else if (lessonProgressResult.data) {
      setLessonProgress(lessonProgressResult.data);
    }

    setPendingSectionId(null);
  }

  async function saveNote() {
    if (!user) {
      setStatus("signed-out");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatus("unavailable");
      return;
    }

    const nextNote = normalizeMultiline(noteText);
    setIsNotePending(true);
    setErrorMessage(null);

    if (!nextNote) {
      const { error } = await supabase
        .from("lesson_notes")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonBundle.lesson.id);

      if (error) {
        if (isMissingLearnerStateTableError(error)) {
          setStatus("unavailable");
          setErrorMessage(null);
          setIsNotePending(false);
          return;
        }

        setErrorMessage("Could not save your lesson note right now.");
      } else {
        setLessonNote(null);
        setNoteText("");
      }

      setIsNotePending(false);
      return;
    }

    const { data, error } = await supabase
      .from("lesson_notes")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonBundle.lesson.id,
          lesson_slug: lessonBundle.lesson.slug,
          note_text: nextNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      )
      .select("*")
      .maybeSingle();

    if (error || !data) {
      if (isMissingLearnerStateTableError(error)) {
        setStatus("unavailable");
        setErrorMessage(null);
        setIsNotePending(false);
        return;
      }

      setErrorMessage("Could not save your lesson note right now.");
    } else {
      setLessonNote(data);
      setNoteText(data.note_text);
    }

    setIsNotePending(false);
  }

  return {
    completedSectionIds,
    errorMessage,
    isBookmarkPending,
    isNotePending,
    noteText,
    noteUpdatedAt: lessonNote?.updated_at ?? null,
    pendingSectionId,
    sectionCompletionEnabled: status === "ready",
    status,
    summary: status === "unavailable" ? createEmptySummary(lessonBundle) : summary,
    toggleBookmark,
    toggleSectionComplete,
    saveNote,
    setNoteText,
    hasUnsavedNoteChanges,
  };
}
