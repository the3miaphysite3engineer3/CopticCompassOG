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

/**
 * Returns one published grammar lesson bundle by slug, or a 404 payload when
 * the slug is unknown.
 */
export async function GET(_request: Request, context: LessonRouteContext) {
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

/**
 * Returns the CORS preflight response for the lesson-detail endpoint.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
