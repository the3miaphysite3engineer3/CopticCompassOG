import { NextResponse } from "next/server";
import { getGrammarApiManifest } from "@/features/grammar/lib/grammarApi";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getGrammarApiManifest());
}
