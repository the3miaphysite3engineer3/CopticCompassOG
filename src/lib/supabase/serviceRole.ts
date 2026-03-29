import { createClient } from "@supabase/supabase-js";
import { assertServerOnly } from "@/lib/server/assertServerOnly";
import { getSupabaseServiceRoleEnv } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

export function createServiceRoleClient() {
  assertServerOnly("createServiceRoleClient");

  const env = getSupabaseServiceRoleEnv();
  if (!env) {
    throw new Error(
      "Supabase service-role environment variables are not configured.",
    );
  }

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
