import { getGrammarApiSourceById } from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

type SourceRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: SourceRouteContext) {
  const { id } = await context.params;
  const source = getGrammarApiSourceById(id);

  if (!source) {
    return publicApiJsonResponse(
      {
        error: `Grammar source not found for id: ${id}`,
      },
      { status: 404 },
    );
  }

  return publicApiJsonResponse(source);
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
