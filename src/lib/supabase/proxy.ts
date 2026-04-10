import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getAuthUnavailableLoginPath,
  getLoginPath,
  getSupabaseRuntimeEnv,
} from "@/lib/supabase/config";
import { requiresAuthSessionProxy } from "@/lib/supabase/proxyRoutes";
import type { Database } from "@/types/supabase";

/**
 * Creates the forwarded middleware response while preserving any request
 * headers added upstream.
 */
function createForwardedResponse(requestHeaders: Headers) {
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Refreshes the Supabase auth session for routes that require it and returns
 * either the forwarded response or the appropriate login redirect.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders?: Headers,
) {
  const forwardedRequestHeaders =
    requestHeaders ?? new Headers(request.headers);
  let supabaseResponse = createForwardedResponse(forwardedRequestHeaders);
  const { pathname } = request.nextUrl;
  const requiresAuthSession = requiresAuthSessionProxy(pathname);

  if (!requiresAuthSession) {
    return supabaseResponse;
  }

  const env = getSupabaseRuntimeEnv();
  if (!env) {
    return NextResponse.redirect(
      new URL(getAuthUnavailableLoginPath(pathname), request.url),
    );
  }

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = createForwardedResponse(forwardedRequestHeaders);
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  /**
   * Refreshes the auth session before route gating so redirects use current
   * cookie state instead of stale middleware data.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(getLoginPath(pathname), request.url));
  }

  return supabaseResponse;
}
