import {
  isDialectFilter,
  isDictionaryPartOfSpeechFilter,
} from "@/features/dictionary/config";
import { getDictionarySearchPage } from "@/features/dictionary/lib/dictionary";
import {
  DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE,
  MAX_DICTIONARY_SEARCH_PAGE_SIZE,
} from "@/features/dictionary/search";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

import type { NextRequest } from "next/server";

/**
 * Returns one paginated page of dictionary results for the current query and
 * filter state so the dictionary UI does not need the full index up front.
 */
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dialect = searchParams.get("dialect");
  const exact = searchParams.get("exact");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const partOfSpeech = searchParams.get("partOfSpeech");
  const query = searchParams.get("q") ?? searchParams.get("query") ?? "";

  if (dialect && !isDialectFilter(dialect)) {
    return publicApiJsonResponse(
      { error: `Invalid dialect filter: ${dialect}` },
      { status: 400 },
    );
  }

  if (partOfSpeech && !isDictionaryPartOfSpeechFilter(partOfSpeech)) {
    return publicApiJsonResponse(
      { error: `Invalid part-of-speech filter: ${partOfSpeech}` },
      { status: 400 },
    );
  }

  if (exact && exact !== "false" && exact !== "true") {
    return publicApiJsonResponse(
      { error: `Invalid exact-match flag: ${exact}` },
      { status: 400 },
    );
  }

  const validatedLimit =
    limit === null
      ? DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE
      : Number.parseInt(limit, 10);
  if (!Number.isInteger(validatedLimit) || validatedLimit < 1) {
    return publicApiJsonResponse(
      { error: `Invalid search page size: ${limit}` },
      { status: 400 },
    );
  }

  const validatedOffset = offset === null ? 0 : Number.parseInt(offset, 10);
  if (!Number.isInteger(validatedOffset) || validatedOffset < 0) {
    return publicApiJsonResponse(
      { error: `Invalid search offset: ${offset}` },
      { status: 400 },
    );
  }

  const validatedDialect =
    dialect && isDialectFilter(dialect) ? dialect : "ALL";
  const validatedPartOfSpeech =
    partOfSpeech && isDictionaryPartOfSpeechFilter(partOfSpeech)
      ? partOfSpeech
      : "ALL";

  return publicApiJsonResponse(
    getDictionarySearchPage({
      exactMatch: exact === "true",
      limit: Math.min(validatedLimit, MAX_DICTIONARY_SEARCH_PAGE_SIZE),
      offset: validatedOffset,
      query,
      selectedDialect: validatedDialect,
      selectedPartOfSpeech: validatedPartOfSpeech,
    }),
    {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}

/**
 * Returns the shared CORS preflight response for paginated dictionary search.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
