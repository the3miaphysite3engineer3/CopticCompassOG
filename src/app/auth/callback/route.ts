import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

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
    // Ignore malformed redirect targets and fall back to the dashboard.
  }

  return fallbackUrl;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // if "next" is in param, use it as the redirect URL
  // this is used for password reset or dynamic redirects
  const next = searchParams.get("next") ?? "/";

  const configuredSiteUrl = getSiteUrl() ?? new URL("https://kyrilloswannes.com");
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

  // Redirect to login if token exchange fails (e.g. invalid or expired link)
  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("state", "login-error");
  loginUrl.searchParams.set("messageType", "error");

  return NextResponse.redirect(loginUrl);
}
