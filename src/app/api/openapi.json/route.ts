import { getGrammarOpenApiDocument } from "@/features/grammar/lib/grammarOpenApi";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

export const dynamic = "force-static";

export function GET() {
  return publicApiJsonResponse(getGrammarOpenApiDocument());
}

export function OPTIONS() {
  return publicApiOptionsResponse();
}
