import { getGrammarApiConceptById } from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

type ConceptRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Returns one published grammar concept by canonical id, or a 404 payload when
 * the id is unknown.
 */
export async function GET(_request: Request, context: ConceptRouteContext) {
  const { id } = await context.params;
  const concept = getGrammarApiConceptById(id);

  if (!concept) {
    return publicApiJsonResponse(
      {
        error: `Grammar concept not found for id: ${id}`,
      },
      { status: 404 },
    );
  }

  return publicApiJsonResponse(concept);
}

/**
 * Returns the CORS preflight response for the concept-detail endpoint.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
