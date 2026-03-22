import { NextResponse } from "next/server";
import { getGrammarApiSourceById } from "@/features/grammar/lib/grammarApi";

export const dynamic = "force-static";

type SourceRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: SourceRouteContext,
) {
  const { id } = await context.params;
  const source = getGrammarApiSourceById(id);

  if (!source) {
    return NextResponse.json(
      {
        error: `Grammar source not found for id: ${id}`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(source);
}
