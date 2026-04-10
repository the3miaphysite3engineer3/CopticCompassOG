import { ETYMOLOGY_FILTERS } from "@/features/analytics/lib/analytics";
import {
  getAnalyticsDrilldownPage,
  type AnalyticsChartDrilldownType,
  type AnalyticsStatDrilldownType,
} from "@/features/analytics/lib/analyticsDrilldown";
import { isDialectFilter } from "@/features/dictionary/config";
import { getDictionaryClientEntries } from "@/features/dictionary/lib/dictionary";
import { MAX_DICTIONARY_SEARCH_PAGE_SIZE } from "@/features/dictionary/search";
import {
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/lib/api/cors";

import type { NextRequest } from "next/server";

const ANALYTICS_DRILLDOWN_CHART_TYPES = new Set<AnalyticsChartDrilldownType>([
  "derivation",
  "etymology",
  "gender",
  "pos",
  "relations",
  "verb",
]);
const ANALYTICS_DRILLDOWN_STAT_TYPES = new Set<AnalyticsStatDrilldownType>([
  "total",
  "uncertain",
  "unknown",
]);

/**
 * Returns one paginated page of analytics drilldown results for the selected
 * chart segment or stat card.
 */
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chartType = searchParams.get("chartType");
  const dialect = searchParams.get("dialect") ?? "ALL";
  const etymology = searchParams.get("etymology") ?? "ALL";
  const kind = searchParams.get("kind");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const originalName = searchParams.get("originalName");
  const statType = searchParams.get("statType");
  const title = searchParams.get("title");

  if (!title || title.trim().length === 0) {
    return publicApiJsonResponse(
      { error: "Missing analytics drilldown title." },
      { status: 400 },
    );
  }

  if (!isDialectFilter(dialect)) {
    return publicApiJsonResponse(
      { error: `Invalid analytics dialect filter: ${dialect}` },
      { status: 400 },
    );
  }

  if (
    !ETYMOLOGY_FILTERS.includes(etymology as (typeof ETYMOLOGY_FILTERS)[number])
  ) {
    return publicApiJsonResponse(
      { error: `Invalid analytics etymology filter: ${etymology}` },
      { status: 400 },
    );
  }

  const validatedLimit = limit === null ? 50 : Number.parseInt(limit, 10);
  if (!Number.isInteger(validatedLimit) || validatedLimit < 1) {
    return publicApiJsonResponse(
      { error: `Invalid analytics drilldown page size: ${limit}` },
      { status: 400 },
    );
  }

  const validatedOffset = offset === null ? 0 : Number.parseInt(offset, 10);
  if (!Number.isInteger(validatedOffset) || validatedOffset < 0) {
    return publicApiJsonResponse(
      { error: `Invalid analytics drilldown offset: ${offset}` },
      { status: 400 },
    );
  }

  if (kind === "stat") {
    if (
      !statType ||
      !ANALYTICS_DRILLDOWN_STAT_TYPES.has(
        statType as AnalyticsStatDrilldownType,
      )
    ) {
      return publicApiJsonResponse(
        { error: `Invalid analytics stat drilldown: ${statType}` },
        { status: 400 },
      );
    }

    return publicApiJsonResponse(
      getAnalyticsDrilldownPage({
        dictionary: getDictionaryClientEntries(),
        drilldown: {
          kind: "stat",
          title,
          type: statType as AnalyticsStatDrilldownType,
        },
        limit: Math.min(validatedLimit, MAX_DICTIONARY_SEARCH_PAGE_SIZE),
        offset: validatedOffset,
        selectedDialect: dialect,
        selectedEtymology: etymology as (typeof ETYMOLOGY_FILTERS)[number],
      }),
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }

  if (kind === "chart") {
    if (
      !chartType ||
      !ANALYTICS_DRILLDOWN_CHART_TYPES.has(
        chartType as AnalyticsChartDrilldownType,
      ) ||
      !originalName
    ) {
      return publicApiJsonResponse(
        { error: "Invalid analytics chart drilldown." },
        { status: 400 },
      );
    }

    return publicApiJsonResponse(
      getAnalyticsDrilldownPage({
        dictionary: getDictionaryClientEntries(),
        drilldown: {
          chartType: chartType as AnalyticsChartDrilldownType,
          kind: "chart",
          originalName,
          title,
        },
        limit: Math.min(validatedLimit, MAX_DICTIONARY_SEARCH_PAGE_SIZE),
        offset: validatedOffset,
        selectedDialect: dialect,
        selectedEtymology: etymology as (typeof ETYMOLOGY_FILTERS)[number],
      }),
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }

  return publicApiJsonResponse(
    { error: `Invalid analytics drilldown kind: ${kind}` },
    { status: 400 },
  );
}

/**
 * Returns the shared CORS preflight response for analytics drilldown pages.
 */
export function OPTIONS() {
  return publicApiOptionsResponse();
}
