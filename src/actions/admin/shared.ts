"use server";

import { getAdminServerContext } from "@/lib/supabase/auth";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";

export type ValidatedAdminContext = NonNullable<
  Awaited<ReturnType<typeof getAdminServerContext>>
>;
export type AdminSupabase = ValidatedAdminContext["supabase"];

export async function getValidatedAdminContext(): Promise<ValidatedAdminContext | null> {
  if (!hasSupabaseRuntimeEnv()) {
    return null;
  }

  const adminContext = await getAdminServerContext();
  if (!adminContext) {
    return null;
  }

  return adminContext;
}
