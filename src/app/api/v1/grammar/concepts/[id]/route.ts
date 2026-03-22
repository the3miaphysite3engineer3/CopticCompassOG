import { NextResponse } from "next/server";
import { getGrammarApiConceptById } from "@/features/grammar/lib/grammarApi";

export const dynamic = "force-static";

type ConceptRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ConceptRouteContext,
) {
  const { id } = await context.params;
  const concept = getGrammarApiConceptById(id);

  if (!concept) {
    return NextResponse.json(
      {
        error: `Grammar concept not found for id: ${id}`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(concept);
}
