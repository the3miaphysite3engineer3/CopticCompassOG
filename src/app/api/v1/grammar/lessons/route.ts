import {
  isGrammarLessonStatus,
  listGrammarApiLessons,
} from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

import type { NextRequest } from "next/server";

export const dynamic = "force-static";

/**
 * Returns published grammar lesson cards, optionally validating the explicit
 * public `status` filter before querying the dataset.
 */
export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  if (status && !isGrammarLessonStatus(status)) {
    return publicApiJsonResponse(
      {
        error: `Invalid lesson status filter: ${status}`,
      },
      { status: 400 },
    );
  }

  const validatedStatus =
    status && isGrammarLessonStatus(status) ? status : undefined;

  return publicApiJsonResponse(listGrammarApiLessons(validatedStatus));
}

/**
 * Returns the CORS preflight response for the public grammar lessons
 * collection.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
