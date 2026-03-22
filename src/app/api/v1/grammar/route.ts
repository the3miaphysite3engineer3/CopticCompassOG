import { NextResponse } from "next/server";
import { getGrammarApiIndex } from "@/features/grammar/lib/grammarApi";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getGrammarApiIndex());
}
