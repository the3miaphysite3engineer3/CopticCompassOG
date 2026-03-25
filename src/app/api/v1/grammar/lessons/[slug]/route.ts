import { getGrammarApiLessonBySlug } from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

type LessonRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  context: LessonRouteContext,
) {
  const { slug } = await context.params;
  const lesson = getGrammarApiLessonBySlug(slug);

  if (!lesson) {
    return publicApiJsonResponse(
      {
        error: `Grammar lesson not found for slug: ${slug}`,
      },
      { status: 404 },
    );
  }

  return publicApiJsonResponse(lesson);
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
