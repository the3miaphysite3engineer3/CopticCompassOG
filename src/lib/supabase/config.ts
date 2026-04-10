const AUTH_UNAVAILABLE_STATE = "auth-unavailable";

/**
 * Rejects unsafe redirect targets so auth flows only round-trip to internal
 * application paths.
 */
function getSafeRedirectTarget(redirectTo?: string) {
  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return null;
  }

  return redirectTo;
}

/**
 * Returns the public Supabase runtime environment when both browser-safe
 * values are configured.
 */
export function getSupabaseRuntimeEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

/**
 * Reports whether the public Supabase runtime environment is configured.
 */
export function hasSupabaseRuntimeEnv() {
  return getSupabaseRuntimeEnv() !== null;
}

/**
 * Returns the service-role Supabase environment only when both the public
 * runtime values and the private service-role key are configured.
 */
export function getSupabaseServiceRoleEnv() {
  const runtimeEnv = getSupabaseRuntimeEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!runtimeEnv || !serviceRoleKey) {
    return null;
  }

  return {
    url: runtimeEnv.url,
    serviceRoleKey,
  };
}

/**
 * Reports whether privileged Supabase service-role access is configured.
 */
export function hasSupabaseServiceRoleEnv() {
  return getSupabaseServiceRoleEnv() !== null;
}

/**
 * Builds the login route, preserving a validated internal redirect target when
 * one is available.
 */
export function getLoginPath(redirectTo?: string) {
  const safeRedirectTarget = getSafeRedirectTarget(redirectTo);

  if (!safeRedirectTarget) {
    return "/login";
  }

  const params = new URLSearchParams({
    redirect_to: safeRedirectTarget,
  });

  return `/login?${params.toString()}`;
}

/**
 * Builds the login route used when Supabase auth is unavailable, preserving an
 * internal redirect target when one is available.
 */
export function getAuthUnavailableLoginPath(redirectTo?: string) {
  const params = new URLSearchParams({
    state: AUTH_UNAVAILABLE_STATE,
    messageType: "error",
  });

  const safeRedirectTarget = getSafeRedirectTarget(redirectTo);

  if (safeRedirectTarget) {
    params.set("redirect_to", safeRedirectTarget);
  }

  return `/login?${params.toString()}`;
}
