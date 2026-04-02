"use client";

import { useState } from "react";
import type {
  GrammarLessonBundle,
  GrammarSectionDocument,
} from "@/content/grammar/schema";
import { createClient } from "@/lib/supabase/client";
import { normalizeMultiline } from "@/lib/validation";
import {
  buildGrammarLessonLearnerSummary,
  type GrammarLessonLearnerSummary,
} from "./grammarLearnerState";
import {
  deleteGrammarLessonBookmark,
  deleteGrammarLessonNote,
  deleteGrammarSectionProgress,
  removeSectionProgressRow,
  saveGrammarLessonBookmark,
  saveGrammarLessonNote,
  saveGrammarSectionProgress,
  syncGrammarLessonProgress,
  upsertSectionProgressRow,
} from "./grammarLessonLearnerClient";
import {
  type GrammarLessonLearnerStatus,
  useGrammarLessonLearnerData,
} from "./useGrammarLessonLearnerData";

type UseGrammarLessonLearnerStateResult = {
  completedSectionIds: string[];
  errorMessage: string | null;
  hasUnsavedNoteChanges: boolean;
  isBookmarkPending: boolean;
  isNotePending: boolean;
  noteText: string;
  noteUpdatedAt: string | null;
  pendingSectionId: string | null;
  saveNote: () => Promise<void>;
  sectionCompletionEnabled: boolean;
  setNoteText: (value: string) => void;
  status: GrammarLessonLearnerStatus;
  summary: GrammarLessonLearnerSummary;
  toggleBookmark: () => Promise<void>;
  toggleSectionComplete: (section: GrammarSectionDocument) => Promise<void>;
};

function createEmptySummary(lessonBundle: GrammarLessonBundle) {
  return buildGrammarLessonLearnerSummary({
    bookmarkRows: [],
    lessonBundle,
    lessonNoteRows: [],
    lessonProgressRows: [],
    sectionProgressRows: [],
  });
}

export function useGrammarLessonLearnerState(
  lessonBundle: GrammarLessonBundle,
): UseGrammarLessonLearnerStateResult {
  const lesson = lessonBundle.lesson;
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [isNotePending, setIsNotePending] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const {
    errorMessage,
    noteText,
    records,
    setErrorMessage,
    setNoteText,
    setRecords,
    setStatus,
    status,
    user,
  } = useGrammarLessonLearnerData(lessonBundle);
  const { bookmark, lessonNote, lessonProgress, sectionProgressRows } = records;

  const summary = buildGrammarLessonLearnerSummary({
    bookmarkRows: bookmark ? [bookmark] : [],
    lessonBundle,
    lessonNoteRows: lessonNote ? [lessonNote] : [],
    lessonProgressRows: lessonProgress ? [lessonProgress] : [],
    sectionProgressRows,
  });
  const normalizedNoteText = normalizeMultiline(noteText);
  const savedNoteText = lessonNote?.note_text ?? "";
  const hasUnsavedNoteChanges = normalizedNoteText !== savedNoteText;
  const completedSectionIds = sectionProgressRows.map((row) => row.section_id);

  function applyUnavailableState() {
    setStatus("unavailable");
    setErrorMessage(null);
  }

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
      const result = await deleteGrammarLessonBookmark(
        supabase,
        user.id,
        lesson.id,
      );

      if (result.isUnavailable) {
        applyUnavailableState();
      } else if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      } else {
        setRecords((currentRecords) => ({
          ...currentRecords,
          bookmark: null,
        }));
      }

      setIsBookmarkPending(false);
      return;
    }

    const result = await saveGrammarLessonBookmark(supabase, user.id, lesson);

    if (result.isUnavailable) {
      applyUnavailableState();
    } else if (result.errorMessage) {
      setErrorMessage(result.errorMessage);
    } else if (result.data) {
      setRecords((currentRecords) => ({
        ...currentRecords,
        bookmark: result.data,
      }));
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
      const deleteResult = await deleteGrammarSectionProgress(
        supabase,
        user.id,
        section.id,
      );

      if (deleteResult.isUnavailable) {
        applyUnavailableState();
        setPendingSectionId(null);
        return;
      }

      if (deleteResult.errorMessage) {
        setErrorMessage(deleteResult.errorMessage);
        setPendingSectionId(null);
        return;
      }

      const nextRows = removeSectionProgressRow(
        sectionProgressRows,
        section.id,
      );
      setRecords((currentRecords) => ({
        ...currentRecords,
        sectionProgressRows: nextRows,
      }));

      const progressResult = await syncGrammarLessonProgress(supabase, {
        completedSections: nextRows.length,
        currentCompletedAt: null,
        lesson,
        userId: user.id,
      });

      if (progressResult.isUnavailable) {
        applyUnavailableState();
        setPendingSectionId(null);
        return;
      }

      if (progressResult.errorMessage) {
        setErrorMessage(progressResult.errorMessage);
        setPendingSectionId(null);
        return;
      }

      if (progressResult.data) {
        setRecords((currentRecords) => ({
          ...currentRecords,
          lessonProgress: progressResult.data,
        }));
      }

      setPendingSectionId(null);
      return;
    }

    const saveResult = await saveGrammarSectionProgress(
      supabase,
      user.id,
      lesson,
      section,
    );

    if (saveResult.isUnavailable) {
      applyUnavailableState();
      setPendingSectionId(null);
      return;
    }

    if (saveResult.errorMessage || !saveResult.data) {
      setErrorMessage(
        saveResult.errorMessage ??
          "Could not update your section progress right now.",
      );
      setPendingSectionId(null);
      return;
    }

    const nextRows = upsertSectionProgressRow(
      sectionProgressRows,
      saveResult.data,
    );
    setRecords((currentRecords) => ({
      ...currentRecords,
      sectionProgressRows: nextRows,
    }));

    const progressResult = await syncGrammarLessonProgress(supabase, {
      completedSections: nextRows.length,
      currentCompletedAt: lessonProgress?.completed_at ?? null,
      lesson,
      userId: user.id,
    });

    if (progressResult.isUnavailable) {
      applyUnavailableState();
      setPendingSectionId(null);
      return;
    }

    if (progressResult.errorMessage) {
      setErrorMessage(progressResult.errorMessage);
    } else if (progressResult.data) {
      setRecords((currentRecords) => ({
        ...currentRecords,
        lessonProgress: progressResult.data,
      }));
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
      const result = await deleteGrammarLessonNote(
        supabase,
        user.id,
        lesson.id,
      );

      if (result.isUnavailable) {
        applyUnavailableState();
      } else if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      } else {
        setRecords((currentRecords) => ({
          ...currentRecords,
          lessonNote: null,
        }));
        setNoteText("");
      }

      setIsNotePending(false);
      return;
    }

    const result = await saveGrammarLessonNote(
      supabase,
      user.id,
      lesson,
      nextNote,
    );

    if (result.isUnavailable) {
      applyUnavailableState();
    } else if (result.errorMessage) {
      setErrorMessage(result.errorMessage);
    } else if (result.data) {
      setRecords((currentRecords) => ({
        ...currentRecords,
        lessonNote: result.data,
      }));
      setNoteText(result.data.note_text);
    }

    setIsNotePending(false);
  }

  return {
    completedSectionIds,
    errorMessage,
    hasUnsavedNoteChanges,
    isBookmarkPending,
    isNotePending,
    noteText,
    noteUpdatedAt: lessonNote?.updated_at ?? null,
    pendingSectionId,
    saveNote,
    sectionCompletionEnabled: status === "ready",
    setNoteText,
    status,
    summary:
      status === "unavailable" ? createEmptySummary(lessonBundle) : summary,
    toggleBookmark,
    toggleSectionComplete,
  };
}
