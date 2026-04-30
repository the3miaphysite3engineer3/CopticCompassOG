import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the post-auth redirect target while keeping navigation on the same
 * origin. Invalid or cross-origin targets fall back to the dashboard.
 */
function getSafeRedirectUrl(next: string, baseUrl: string) {
  const fallbackUrl = new URL("/dashboard", baseUrl);

  if (next.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, baseUrl);
  }

  try {
    const targetUrl = new URL(next);
    if (targetUrl.origin === new URL(baseUrl).origin) {
      return targetUrl;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

/**
 * Exchanges the Supabase auth code and redirects either to the requested
 * in-app destination or to the login page with an auth failure state.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const configuredSiteUrl =
    getSiteUrl() ?? new URL("https://www.copticcompass.com");
  const baseUrl = configuredSiteUrl.toString().endsWith("/")
    ? configuredSiteUrl.toString().slice(0, -1)
    : configuredSiteUrl.toString();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(next, baseUrl));
    }
  }

  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("state", "login-error");
  loginUrl.searchParams.set("messageType", "error");

  return NextResponse.redirect(loginUrl);
}
