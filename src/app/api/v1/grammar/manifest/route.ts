import { getGrammarApiManifest } from "@/features/grammar/lib/grammarApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

export function GET() {
  return publicApiJsonResponse(getGrammarApiManifest());
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
