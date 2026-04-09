import { getDictionaryClientEntries } from "@/features/dictionary/lib/dictionary";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

/**
 * Returns the reduced dictionary payload used by client search and analytics
 * drilldowns without shipping raw/source-only dictionary fields.
 */
export function GET() {
  return publicApiJsonResponse(getDictionaryClientEntries());
}

/**
 * Returns the shared CORS preflight response for the reduced dictionary index.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
