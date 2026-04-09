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

/**
 * Returns one published grammar source by canonical id, or a 404 payload when
 * the id is unknown.
 */
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

/**
 * Returns the CORS preflight response for the source-detail endpoint.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
