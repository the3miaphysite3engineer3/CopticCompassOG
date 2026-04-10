import { getGrammarOpenApiDocument } from "@/features/grammar/lib/grammarOpenApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

/**
 * Returns the generated grammar OpenAPI document as a static public API
 * response.
 */
export function GET() {
  return publicApiJsonResponse(getGrammarOpenApiDocument());
}

/**
 * Returns the CORS preflight response for the public OpenAPI document
 * endpoint.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
