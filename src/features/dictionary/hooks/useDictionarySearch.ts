"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  DEFAULT_PART_OF_SPEECH_FILTER,
  isDialectFilter,
  type DialectFilter,
  type DictionaryPartOfSpeechFilter,
} from "@/features/dictionary/config";
import {
  prepareDictionaryForSearch,
  searchPreparedDictionary,
  type PreparedLexicalEntry,
} from "@/features/dictionary/search";
import type { LexicalEntry } from "@/features/dictionary/types";
import { createClient } from "@/lib/supabase/client";
import { loadBrowserUser } from "@/lib/supabase/clientAuth";

type UseDictionarySearchOptions = {
  dictionaryPath: string;
};

export function useDictionarySearch({
  dictionaryPath,
}: UseDictionarySearchOptions) {
  const [dictionary, setDictionary] = useState<LexicalEntry[]>([]);
  const [preparedDictionary, setPreparedDictionary] = useState<
    PreparedLexicalEntry[]
  >([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] =
    useState<DictionaryPartOfSpeechFilter>(DEFAULT_PART_OF_SPEECH_FILTER);
  const [selectedDialect, setSelectedDialectState] = useState<DialectFilter>(
    DEFAULT_DICTIONARY_DIALECT_FILTER,
  );
  const [exactMatch, setExactMatch] = useState<boolean>(false);
  const [preferenceUserId, setPreferenceUserId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const hasDeepLinkedQueryRef = useRef(false);

  useEffect(() => {
    // Deep-linked searches hydrate from ?q=... so shared dictionary URLs open
    // with the intended query already applied.
    let cancelled = false;

    async function loadDictionary() {
      const initialQuery =
        typeof window === "undefined"
          ? ""
          : (new URLSearchParams(window.location.search).get("q")?.trim() ??
            "");
      hasDeepLinkedQueryRef.current = initialQuery.length > 0;

      try {
        const response = await fetch(dictionaryPath);
        if (!response.ok) {
          throw new Error("JSON not found");
        }

        const data = (await response.json()) as LexicalEntry[];
        if (!cancelled) {
          if (initialQuery) {
            setQuery(initialQuery);
            setSelectedDialectState("ALL");
          }
          setDictionary(data);
          setPreparedDictionary(prepareDictionaryForSearch(data));
          setLoading(false);
        }
      } catch {
        console.warn("Target language dictionary missing...");
        if (!cancelled) {
          setDictionary([]);
          setPreparedDictionary([]);
          setLoading(false);
        }
      }
    }

    void loadDictionary();

    return () => {
      cancelled = true;
    };
  }, [dictionaryPath]);

  useEffect(() => {
    const supabaseClient = createClient();
    if (!supabaseClient) {
      return;
    }
    const supabase = supabaseClient;

    let isMounted = true;

    async function applyUserPreference(nextUserId: string | null) {
      if (!isMounted) {
        return;
      }

      setPreferenceUserId(nextUserId);

      if (!nextUserId || hasDeepLinkedQueryRef.current) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_dictionary_dialect")
        .eq("id", nextUserId)
        .maybeSingle();

      if (!isMounted || error) {
        return;
      }

      const preferredDialect = data?.preferred_dictionary_dialect;
      if (preferredDialect && isDialectFilter(preferredDialect)) {
        setSelectedDialectState(preferredDialect);
      }
    }

    void loadBrowserUser(supabase)
      .then((nextUser) => applyUserPreference(nextUser?.id ?? null))
      .catch(() => applyUserPreference(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUserPreference(session?.user?.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSelectionChange = useCallback(
    (start: number | null, end: number | null) => {
      const fallback = end ?? start ?? query.length;

      selectionRef.current = {
        start: start ?? fallback,
        end: end ?? fallback,
      };
    },
    [query.length],
  );

  const restoreInputSelection = useCallback((cursorPosition: number) => {
    requestAnimationFrame(() => {
      const input = searchInputRef.current;
      if (!input) return;

      input.focus();
      input.setSelectionRange(cursorPosition, cursorPosition);
      selectionRef.current = { start: cursorPosition, end: cursorPosition };
    });
  }, []);

  const filteredResults = useMemo(() => {
    let results =
      deferredQuery.trim().length > 0
        ? searchPreparedDictionary(
            deferredQuery,
            preparedDictionary,
            exactMatch,
          )
        : dictionary;

    if (selectedPartOfSpeech !== "ALL") {
      results = results.filter((result) => result.pos === selectedPartOfSpeech);
    }

    if (selectedDialect !== "ALL") {
      results = results.filter(
        (result) => result.dialects[selectedDialect] !== undefined,
      );
    }

    return results;
  }, [
    deferredQuery,
    dictionary,
    preparedDictionary,
    selectedPartOfSpeech,
    selectedDialect,
    exactMatch,
  ]);

  const handleKeyboardAppend = useCallback(
    (char: string) => {
      setQuery((prev) => {
        const start = Math.min(selectionRef.current.start, prev.length);
        const end = Math.min(selectionRef.current.end, prev.length);
        const nextQuery = prev.slice(0, start) + char + prev.slice(end);
        const nextCursor = start + char.length;

        selectionRef.current = { start: nextCursor, end: nextCursor };
        restoreInputSelection(nextCursor);

        return nextQuery;
      });
    },
    [restoreInputSelection],
  );

  const handleKeyboardBackspace = useCallback(() => {
    setQuery((prev) => {
      const start = Math.min(selectionRef.current.start, prev.length);
      const end = Math.min(selectionRef.current.end, prev.length);

      if (start !== end) {
        const nextQuery = prev.slice(0, start) + prev.slice(end);
        selectionRef.current = { start, end: start };
        restoreInputSelection(start);
        return nextQuery;
      }

      if (start === 0) {
        restoreInputSelection(0);
        return prev;
      }

      const nextCursor = start - 1;
      const nextQuery = prev.slice(0, nextCursor) + prev.slice(end);
      selectionRef.current = { start: nextCursor, end: nextCursor };
      restoreInputSelection(nextCursor);
      return nextQuery;
    });
  }, [restoreInputSelection]);

  // Infinite-scroll rendering resets when query or filters change, so the list
  // gets a stable key derived from the effective search state.
  const resultsKey = `${deferredQuery}\u0000${selectedPartOfSpeech}\u0000${selectedDialect}\u0000${exactMatch}`;
  const setSelectedDialect = useCallback(
    (value: DialectFilter) => {
      setSelectedDialectState(value);

      if (!preferenceUserId) {
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        return;
      }

      void supabase
        .from("profiles")
        .update({ preferred_dictionary_dialect: value })
        .eq("id", preferenceUserId);
    },
    [preferenceUserId],
  );

  return {
    dictionaryLength: dictionary.length,
    filteredResults,
    handleKeyboardAppend,
    handleKeyboardBackspace,
    handleSelectionChange,
    isKeyboardOpen,
    loading,
    query,
    resultsKey,
    searchInputRef,
    selectedDialect,
    selectedPartOfSpeech,
    setKeyboardOpen,
    setQuery,
    setSelectedDialect,
    setSelectedPartOfSpeech,
    exactMatch,
    setExactMatch,
    visibleQuery: deferredQuery,
  };
}
