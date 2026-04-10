import { describe, expect, it } from "vitest";

import {
  buildAnalyticsChartDrilldown,
  buildAnalyticsStatDrilldown,
  getAnalyticsDrilldownPage,
} from "@/features/analytics/lib/analyticsDrilldown";
import type { DictionaryClientEntry } from "@/features/dictionary/types";

const dictionary: DictionaryClientEntry[] = [
  {
    dialects: {
      B: {
        absolute: "ϭⲱⲓⲥ",
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    english_meanings: ["lord"],
    gender: "",
    greek_equivalents: [],
    headword: "ϭⲱⲓⲥ",
    id: "cd_17",
    pos: "N",
  },
  {
    dialects: {
      B: {
        absolute: "ⲉⲓⲱⲧ",
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    english_meanings: ["meaning unknown"],
    etymology: "Gr",
    gender: "M",
    greek_equivalents: [],
    headword: "ⲉⲓⲱⲧ",
    id: "cd_18",
    pos: "N",
  },
  {
    dialects: {
      S: {
        absolute: "ⲃⲱⲕ",
        nominal: "",
        pronominal: "",
        stative: "ⲃⲏⲕ",
      },
    },
    english_meanings: ["run"],
    gender: "",
    greek_equivalents: [],
    headword: "ⲃⲱⲕ",
    id: "cd_19",
    pos: "V",
  },
];

describe("analytics drilldown", () => {
  it("pages stat drilldowns after dialect and etymology filters", () => {
    const page = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsStatDrilldown({
        totalTitle: "All entries",
        type: "total",
        uncertainTitle: "Meaning uncertain",
        unknownTitle: "Meaning unknown",
      }),
      limit: 1,
      offset: 0,
      selectedDialect: "B",
      selectedEtymology: "Gr",
    });

    expect(page).toMatchObject({
      entries: [{ id: "cd_18" }],
      hasMore: false,
      totalEntries: 3,
      totalMatches: 1,
    });
  });

  it("matches chart drilldowns with paginated results", () => {
    const page = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsChartDrilldown({
        originalName: "Nouns",
        title: "Nouns",
        type: "pos",
      }),
      limit: 1,
      offset: 1,
      selectedDialect: "ALL",
      selectedEtymology: "ALL",
    });

    expect(page).toMatchObject({
      entries: [{ id: "cd_18" }],
      hasMore: false,
      nextOffset: null,
      totalMatches: 2,
    });
  });
});
