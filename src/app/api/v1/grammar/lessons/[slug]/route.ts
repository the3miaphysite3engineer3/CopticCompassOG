import { NextResponse } from "next/server";
import { getGrammarApiLessonBySlug } from "@/features/grammar/lib/grammarApi";

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
    return NextResponse.json(
      {
        error: `Grammar lesson not found for slug: ${slug}`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(lesson);
}
