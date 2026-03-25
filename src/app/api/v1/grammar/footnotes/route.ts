import { NextRequest } from "next/server";
import {
  listGrammarApiFootnotes,
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

  return publicApiJsonResponse(listGrammarApiFootnotes(lessonId ?? undefined));
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
