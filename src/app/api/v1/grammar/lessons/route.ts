import { NextRequest, NextResponse } from "next/server";
import {
  isGrammarLessonStatus,
  listGrammarApiLessons,
} from "@/features/grammar/lib/grammarApi";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  if (status && !isGrammarLessonStatus(status)) {
    return NextResponse.json(
      {
        error: `Invalid lesson status filter: ${status}`,
      },
      { status: 400 },
    );
  }

  const validatedStatus = status && isGrammarLessonStatus(status) ? status : undefined;

  return NextResponse.json(listGrammarApiLessons(validatedStatus));
}
