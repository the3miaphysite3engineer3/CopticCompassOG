import { NextResponse } from "next/server";

const PUBLIC_API_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, If-None-Match",
  "Access-Control-Max-Age": "86400",
} as const;

function withPublicApiCors(response: NextResponse) {
  Object.entries(PUBLIC_API_CORS_HEADERS).forEach(([key, value]) => {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  });

  return response;
}

export function publicApiJsonResponse(body: unknown, init?: ResponseInit) {
  return withPublicApiCors(NextResponse.json(body, init));
}

export function publicApiOptionsResponse() {
  return withPublicApiCors(
    new NextResponse(null, {
      status: 204,
    }),
  );
}
