"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";

import type {
  EntryFavoriteErrorCode,
  EntryFavoriteInsert,
  EntryFavoriteRow,
} from "./entryActions";

/**
 * Loads and toggles the current user's favorite state for a dictionary entry,
 * including optimistic updates and table-availability handling.
 */
export function useEntryFavorite(entryId: string, userId: string | null) {
  const [favorite, setFavorite] = useState<EntryFavoriteRow | null>(null);
  const [errorCode, setErrorCode] = useState<EntryFavoriteErrorCode | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [isPending, setIsPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<"remove" | "save" | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;
    async function syncFavorite() {
      if (!userId) {
        if (!isMounted) {
          return;
        }

        setFavorite(null);
        setErrorCode(null);
        setIsLoading(false);
        setIsPending(false);
        setPendingAction(null);
        return;
      }

      if (isMounted) {
        setFavorite(null);
        setErrorCode(null);
        setIsLoading(true);
      }

      const supabase = createClient();
      if (!supabase) {
        if (!isMounted) {
          return;
        }

        setFavorite(null);
        setErrorCode("unavailable");
        setIsLoading(false);
        setIsPending(false);
        setPendingAction(null);
        return;
      }

      const { data, error } = await supabase
        .from("entry_favorites")
        .select("*")
        .eq("user_id", userId)
        .eq("entry_id", entryId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        if (isMissingSupabaseTableError(error)) {
          setErrorCode("not-configured");
          setFavorite(null);
          setIsLoading(false);
          return;
        }

        setErrorCode("load-failed");
        setIsLoading(false);
        return;
      }

      setFavorite(data ?? null);
      setErrorCode(null);
      setIsLoading(false);
    }

    void syncFavorite();

    return () => {
      isMounted = false;
    };
  }, [entryId, userId]);

  /**
   * Optimistically saves or removes the favorite row for the current user.
   */
  async function toggleFavorite() {
    if (!userId || isLoading) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setErrorCode("unavailable");
      setIsPending(false);
      setPendingAction(null);
      return;
    }

    setIsPending(true);
    setPendingAction(favorite ? "remove" : "save");
    setErrorCode(null);

    const previousFavorite = favorite;

    if (favorite) {
      setFavorite(null);

      const { error } = await supabase
        .from("entry_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("entry_id", entryId);

      if (error) {
        setFavorite(previousFavorite);
        if (isMissingSupabaseTableError(error)) {
          setErrorCode("not-configured");
        } else {
          setErrorCode("update-failed");
        }
      }

      setIsPending(false);
      setPendingAction(null);
      return;
    }

    const favoritePayload: EntryFavoriteInsert = {
      entry_id: entryId,
      user_id: userId,
    };
    const optimisticFavorite: EntryFavoriteRow = {
      created_at: new Date().toISOString(),
      ...favoritePayload,
    };

    setFavorite(optimisticFavorite);

    const { data, error } = await supabase
      .from("entry_favorites")
      .upsert(favoritePayload, { onConflict: "user_id,entry_id" })
      .select("*")
      .maybeSingle();

    if (error) {
      setFavorite(previousFavorite);
      if (isMissingSupabaseTableError(error)) {
        setErrorCode("not-configured");
      } else {
        setErrorCode("update-failed");
      }
    } else {
      setFavorite(data ?? null);
    }

    setIsPending(false);
    setPendingAction(null);
  }

  return {
    errorCode,
    isFavorited: Boolean(favorite),
    isLoading,
    isPending,
    pendingAction,
    toggleFavorite,
  };
}
