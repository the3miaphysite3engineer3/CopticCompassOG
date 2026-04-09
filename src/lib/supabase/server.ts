import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseRuntimeEnv } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

/**
 * Creates the server-side Supabase client used by route handlers and server
 * actions. Cookie writes are best-effort here because some Server Component
 * requests cannot mutate cookies directly.
 */
export async function createClient() {
  const env = getSupabaseRuntimeEnv();
  if (!env) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /**
           * The proxy layer refreshes sessions for requests that cannot write
           * cookies directly from a Server Component context.
           */
        }
      },
    },
  });
}
