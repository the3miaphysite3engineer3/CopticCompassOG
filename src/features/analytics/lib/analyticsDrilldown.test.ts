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
    etymology: "Egy",
    greek_equivalents: [],
    headword: "ϭⲱⲓⲥ",
    id: "cd_17",
    meaningGroups: [{ grammar: { pos: "N" }, english_meanings: ["lord"] }],
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
    etymology: "Gr",
    greek_equivalents: [],
    headword: "ⲉⲓⲱⲧ",
    id: "cd_18",
    meaningGroups: [
      {
        grammar: { gender: "M", pos: "N" },
        english_meanings: ["meaning unknown"],
      },
    ],
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
    etymology: "Egy",
    greek_equivalents: [],
    headword: "ⲃⲱⲕ",
    id: "cd_19",
    meaningGroups: [{ grammar: { pos: "V" }, english_meanings: ["run"] }],
  },
  {
    dialects: {
      M: {
        absolute: "ϯϫⲣⲉ ⲛϩⲏⲧ",
      },
    },
    etymology: "Unknown",
    headword: "ϯϫⲣⲉ ⲛϩⲏⲧ",
    id: "cd_7348",
    meaningGroups: [
      { grammar: { pos: "V" }, english_meanings: ["encourage, console"] },
    ],
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
      totalEntries: 4,
      totalMatches: 1,
    });
  });

  it("matches explicit unknown etymology filters and chart slices", () => {
    const filteredPage = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsStatDrilldown({
        totalTitle: "All entries",
        type: "total",
        uncertainTitle: "Meaning uncertain",
        unknownTitle: "Meaning unknown",
      }),
      selectedDialect: "ALL",
      selectedEtymology: "Unknown",
    });
    const chartPage = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsChartDrilldown({
        originalName: "analytics.unknownEtymology",
        title: "Unknown etymology",
        type: "etymology",
      }),
      selectedDialect: "ALL",
      selectedEtymology: "ALL",
    });

    expect(filteredPage).toMatchObject({
      entries: [{ id: "cd_7348" }],
      totalMatches: 1,
    });
    expect(chartPage).toMatchObject({
      entries: [{ id: "cd_7348" }],
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

  it("matches part-of-speech chart drilldowns through meaning-group grammar", () => {
    const page = getAnalyticsDrilldownPage({
      dictionary: [
        {
          dialects: {
            B: {
              absolute: "ⲉⲛⲉϩ",
            },
          },
          headword: "ⲉⲛⲉϩ",
          etymology: "Egy",
          id: "cd_adjectival_noun",
          meaningGroups: [
            {
              grammar: {
                gender: "M",
                pos: "N",
              },
              english_meanings: ["eternity"],
            },
            {
              grammar: {
                pos: "ADJ",
              },
              english_meanings: ["eternal"],
            },
          ],
        },
      ],
      drilldown: buildAnalyticsChartDrilldown({
        originalName: "Adjectives",
        title: "Adjectives",
        type: "pos",
      }),
      limit: 10,
      offset: 0,
      selectedDialect: "ALL",
      selectedEtymology: "ALL",
    });

    expect(page).toMatchObject({
      entries: [{ id: "cd_adjectival_noun" }],
      totalMatches: 1,
    });
  });
});
