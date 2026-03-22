import { NextRequest, NextResponse } from "next/server";
import {
  listGrammarApiFootnotes,
  resolveGrammarLessonFilter,
} from "@/features/grammar/lib/grammarApi";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  const lessonFilter = request.nextUrl.searchParams.get("lesson");
  const lessonId = resolveGrammarLessonFilter(lessonFilter);

  if (lessonFilter?.trim() && !lessonId) {
    return NextResponse.json(
      {
        error: `Unknown lesson filter: ${lessonFilter}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(listGrammarApiFootnotes(lessonId ?? undefined));
}
