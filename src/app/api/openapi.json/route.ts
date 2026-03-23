import { NextResponse } from "next/server";
import { getGrammarOpenApiDocument } from "@/features/grammar/lib/grammarOpenApi";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getGrammarOpenApiDocument());
}
