"use client";

import { useEffect, useState } from "react";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { loadBrowserUser } from "@/lib/supabase/clientAuth";

import type { User } from "@supabase/supabase-js";

type OptionalAuthGateStatus =
  | "loading"
  | "signed-in"
  | "signed-out"
  | "unavailable";

/**
 * Tracks the optional browser auth state for UI that can adapt to auth when it
 * is configured but should still render when auth is unavailable.
 */
export function useOptionalAuthGate() {
  const authAvailable = hasSupabaseEnv();
  const [status, setStatus] = useState<OptionalAuthGateStatus>(
    authAvailable ? "loading" : "unavailable",
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!authAvailable) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    void loadBrowserUser(supabase)
      .then((nextUser) => {
        if (!isMounted) {
          return;
        }

        setUser(nextUser);
        setStatus(nextUser ? "signed-in" : "signed-out");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setStatus("signed-out");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? "signed-in" : "signed-out");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authAvailable]);

  return {
    authAvailable,
    isAuthenticated: status === "signed-in",
    isReady: status !== "loading",
    status,
    user,
  };
}
