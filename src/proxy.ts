import { type NextRequest } from "next/server";

import { getPublicLocaleFromPathname } from "@/lib/locale";
import { buildContentSecurityPolicy } from "@/lib/securityHeaders";
import { CSP_NONCE_HEADER } from "@/lib/server/csp";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Applies a static-friendly CSP to localized public pages while reserving the
 * per-request CSP nonce for the non-localized app shell that still needs it.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLocalizedPublicRoute = Boolean(getPublicLocaleFromPathname(pathname));
  const nonce = isLocalizedPublicRoute
    ? null
    : Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({ nonce });
  const requestHeaders = new Headers(request.headers);

  if (nonce) {
    requestHeaders.set(CSP_NONCE_HEADER, nonce);
  }

  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

/**
 * Limits the proxy to routed document requests while skipping static assets and
 * prefetch traffic.
 */
export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|apple-touch-icon-precomposed.png|manifest.json|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
