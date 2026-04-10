import { NextResponse } from "next/server";

const PUBLIC_API_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, If-None-Match",
  "Access-Control-Max-Age": "86400",
} as const;

/**
 * Applies the shared public-API CORS headers to a response without
 * overwriting any route-specific values that were already set.
 */
function withPublicApiCors(response: NextResponse) {
  Object.entries(PUBLIC_API_CORS_HEADERS).forEach(([key, value]) => {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  });

  return response;
}

/**
 * Returns a JSON response for the public read-only API with the shared CORS
 * policy applied.
 */
export function publicApiJsonResponse(body: unknown, init?: ResponseInit) {
  return withPublicApiCors(NextResponse.json(body, init));
}

/**
 * Returns the shared CORS preflight response for public read-only API routes.
 */
export function publicApiOptionsResponse() {
  return withPublicApiCors(
    new NextResponse(null, {
      status: 204,
    }),
  );
}
