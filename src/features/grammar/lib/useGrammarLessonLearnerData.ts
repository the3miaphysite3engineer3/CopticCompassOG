"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { User } from "@supabase/supabase-js";
import type { GrammarLessonBundle } from "@/content/grammar/schema";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import {
  createEmptyGrammarLessonLearnerRecords,
  loadGrammarLessonLearnerRecords,
  syncGrammarLessonProgress,
  type GrammarLessonLearnerRecords,
} from "./grammarLessonLearnerClient";

export type GrammarLessonLearnerStatus =
  | "loading"
  | "ready"
  | "signed-out"
  | "unavailable";

type UseGrammarLessonLearnerDataResult = {
  errorMessage: string | null;
  noteText: string;
  records: GrammarLessonLearnerRecords;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setNoteText: Dispatch<SetStateAction<string>>;
  setRecords: Dispatch<SetStateAction<GrammarLessonLearnerRecords>>;
  setStatus: Dispatch<SetStateAction<GrammarLessonLearnerStatus>>;
  status: GrammarLessonLearnerStatus;
  user: User | null;
};

export function useGrammarLessonLearnerData(
  lessonBundle: GrammarLessonBundle,
): UseGrammarLessonLearnerDataResult {
  const supabaseAvailable = hasSupabaseEnv();
  const [supabase] = useState(() =>
    supabaseAvailable ? createClient() : null,
  );
  const lesson = lessonBundle.lesson;
  const lessonSectionOrderKey = lesson.sectionOrder.join("|");
  const [status, setStatus] = useState<GrammarLessonLearnerStatus>(
    supabase ? "loading" : "unavailable",
  );
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<GrammarLessonLearnerRecords>(
    createEmptyGrammarLessonLearnerRecords(),
  );
  const [noteText, setNoteText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseAvailable || !supabase) {
      return;
    }

    let isMounted = true;

    const applySignedOutState = () => {
      if (!isMounted) {
        return;
      }

      setUser(null);
      setRecords(createEmptyGrammarLessonLearnerRecords());
      setNoteText("");
      setErrorMessage(null);
      setStatus("signed-out");
    };

    const applyUnavailableState = (currentUser: User | null) => {
      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      setRecords(createEmptyGrammarLessonLearnerRecords());
      setNoteText("");
      setErrorMessage(null);
      setStatus("unavailable");
    };

    const loadLearnerState = async (currentUser: User | null) => {
      if (!currentUser) {
        applySignedOutState();
        return;
      }

      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      setErrorMessage(null);
      setStatus("loading");

      const loadResult = await loadGrammarLessonLearnerRecords(
        supabase,
        currentUser.id,
        lesson.id,
      );

      if (!isMounted) {
        return;
      }

      if (loadResult.isUnavailable) {
        applyUnavailableState(currentUser);
        return;
      }

      setRecords(loadResult.records);
      setNoteText(loadResult.records.lessonNote?.note_text ?? "");
      setErrorMessage(loadResult.errorMessage);
      setStatus("ready");

      const progressResult = await syncGrammarLessonProgress(supabase, {
        completedSections: loadResult.records.sectionProgressRows.length,
        currentCompletedAt:
          loadResult.records.lessonProgress?.completed_at ?? null,
        lesson,
        userId: currentUser.id,
      });

      if (!isMounted) {
        return;
      }

      if (progressResult.isUnavailable) {
        applyUnavailableState(currentUser);
        return;
      }

      if (progressResult.errorMessage) {
        setErrorMessage(progressResult.errorMessage);
        return;
      }

      if (progressResult.data) {
        setRecords((currentRecords) => ({
          ...currentRecords,
          lessonProgress: progressResult.data,
        }));
      }
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
  }, [lesson.id, lesson.slug, lessonSectionOrderKey, supabaseAvailable]);

  return {
    errorMessage,
    noteText,
    records,
    setErrorMessage,
    setNoteText,
    setRecords,
    setStatus,
    status,
    user,
  };
}
