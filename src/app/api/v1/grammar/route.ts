import { getGrammarApiIndex } from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

/**
 * Returns the public grammar API index as a static discovery document.
 */
export function GET() {
  return publicApiJsonResponse(getGrammarApiIndex());
}

/**
 * Returns the CORS preflight response for the public grammar API index.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
