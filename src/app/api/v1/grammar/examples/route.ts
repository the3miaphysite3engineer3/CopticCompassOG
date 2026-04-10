import {
  listGrammarApiExamples,
  resolveGrammarLessonFilter,
} from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

import type { NextRequest } from "next/server";

export const dynamic = "force-static";

/**
 * Returns published grammar examples, optionally filtered to one lesson slug
 * or lesson id after validating the lesson query parameter.
 */
export function GET(request: NextRequest) {
  const lessonFilter = request.nextUrl.searchParams.get("lesson");
  const lessonId = resolveGrammarLessonFilter(lessonFilter);

  if (lessonFilter?.trim() && !lessonId) {
    return publicApiJsonResponse(
      {
        error: `Unknown lesson filter: ${lessonFilter}`,
      },
      { status: 400 },
    );
  }

  return publicApiJsonResponse(listGrammarApiExamples(lessonId ?? undefined));
}

/**
 * Returns the CORS preflight response for the grammar examples collection.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
