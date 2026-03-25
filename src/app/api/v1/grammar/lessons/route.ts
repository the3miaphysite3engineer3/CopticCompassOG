import { NextRequest } from "next/server";
import {
  isGrammarLessonStatus,
  listGrammarApiLessons,
} from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

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

  const validatedStatus = status && isGrammarLessonStatus(status) ? status : undefined;

  return publicApiJsonResponse(listGrammarApiLessons(validatedStatus));
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
