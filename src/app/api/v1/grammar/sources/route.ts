import { NextRequest } from "next/server";
import {
  listGrammarApiSources,
  resolveGrammarLessonFilter,
} from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

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

  return publicApiJsonResponse(listGrammarApiSources(lessonId ?? undefined));
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
