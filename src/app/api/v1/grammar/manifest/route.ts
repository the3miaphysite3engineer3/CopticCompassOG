import { getGrammarApiManifest } from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

/**
 * Returns the published grammar dataset manifest as a static public API
 * response.
 */
export function GET() {
  return publicApiJsonResponse(getGrammarApiManifest());
}

/**
 * Returns the CORS preflight response for the public grammar manifest
 * endpoint.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
