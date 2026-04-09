"use client";

import { ArrowLeft, Filter } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { buttonClassName } from "@/components/Button";
import { CompactSelect } from "@/components/CompactSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import {
  type AnalyticsSnapshotMap,
  type EtymologyFilter,
} from "@/features/analytics/lib/analytics";
import {
  buildAnalyticsChartDrilldown,
  buildAnalyticsStatDrilldown,
  type AnalyticsDrilldownPage,
  type AnalyticsDrilldown,
} from "@/features/analytics/lib/analyticsDrilldown";
import { useAnalyticsThemeColors } from "@/features/analytics/lib/useAnalyticsThemeColors";
import { DictionaryResultsSection } from "@/features/dictionary/components/DictionaryResultsSection";
import {
  type AnalyticsDialect,
  dialectFilterOptions,
  getDialectFilterOptionLabel,
} from "@/features/dictionary/config";
import type { DictionaryClientEntry } from "@/features/dictionary/types";
import { cx } from "@/lib/classes";
import type { TranslationKey } from "@/lib/i18n";
import { getDictionaryPath, getLocalizedHomePath } from "@/lib/locale";

import { AnalyticsPieChartCard } from "./AnalyticsPieChartCard";
import { AnalyticsSlideOver } from "./AnalyticsSlideOver";

const ANALYTICS_DRILLDOWN_PAGE_SIZE = 50;

type AnalyticsStatCardProps = {
  accentClassName: string;
  title: string;
  value: string;
  valueClassName?: string;
  onClick?: () => void;
};

function AnalyticsStatCard({
  accentClassName,
  title,
  value,
  valueClassName = "text-5xl font-bold text-stone-800 dark:text-stone-200",
  onClick,
}: AnalyticsStatCardProps) {
  return (
    <SurfacePanel
      rounded="3xl"
      variant="subtle"
      shadow="soft"
      className={cx(
        "relative overflow-hidden p-6",
        onClick &&
          "cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]",
      )}
      onClick={onClick}
    >
      <div
        className={cx(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl",
          accentClassName,
        )}
      />
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
        {title}
      </h3>
      <p className={valueClassName}>{value}</p>
    </SurfacePanel>
  );
}

type AnalyticsPageClientProps = {
  snapshots: AnalyticsSnapshotMap;
};

type AnalyticsChartClickPayload = {
  name?: string;
  payload?: {
    originalName?: string;
  };
};

function isAnalyticsChartClickPayload(
  value: unknown,
): value is AnalyticsChartClickPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as AnalyticsChartClickPayload;
  return (
    candidate.payload === undefined || typeof candidate.payload === "object"
  );
}

/**
 * Serializes the active analytics drilldown state into the public API query
 * shape so the slide-over can request only the current page of entries.
 */
function buildAnalyticsDrilldownUrl(options: {
  drilldown: AnalyticsDrilldown;
  limit: number;
  offset: number;
  selectedDialect: AnalyticsDialect;
  selectedEtymology: EtymologyFilter;
}) {
  const params = new URLSearchParams({
    dialect: options.selectedDialect,
    etymology: options.selectedEtymology,
    kind: options.drilldown.kind,
    limit: String(options.limit),
    offset: String(options.offset),
    title: options.drilldown.title,
  });

  if (options.drilldown.kind === "stat") {
    params.set("statType", options.drilldown.type);
  } else {
    params.set("chartType", options.drilldown.chartType);
    params.set("originalName", options.drilldown.originalName);
  }

  return `/api/v1/analytics/drilldown?${params.toString()}`;
}

export default function AnalyticsPageClient({
  snapshots,
}: AnalyticsPageClientProps) {
  const [selectedDialect, setSelectedDialect] = useState<AnalyticsDialect>("B");
  const [selectedEtymology, setSelectedEtymology] =
    useState<EtymologyFilter>("ALL");
  const [slideOverFilter, setSlideOverFilter] =
    useState<AnalyticsDrilldown | null>(null);
  const [slideOverResults, setSlideOverResults] = useState<
    DictionaryClientEntry[]
  >([]);
  const [slideOverDictionaryLength, setSlideOverDictionaryLength] = useState(0);
  const [slideOverTotalMatches, setSlideOverTotalMatches] = useState(0);
  const [hasMoreSlideOverResults, setHasMoreSlideOverResults] = useState(false);
  const [isSlideOverLoading, setSlideOverLoading] = useState(false);
  const [isSlideOverLoadingMore, setSlideOverLoadingMore] = useState(false);
  const activeDrilldownKeyRef = useRef("");

  const { language, t } = useLanguage();
  const stats =
    snapshots[selectedDialect]?.[selectedEtymology] ?? snapshots.ALL.ALL;
  const { colors, isThemeReady } = useAnalyticsThemeColors();

  useEffect(() => {
    if (!slideOverFilter) {
      activeDrilldownKeyRef.current = "";
      setSlideOverResults([]);
      setSlideOverDictionaryLength(0);
      setSlideOverTotalMatches(0);
      setHasMoreSlideOverResults(false);
      setSlideOverLoading(false);
      setSlideOverLoadingMore(false);
      return;
    }

    const activeSlideOverFilter = slideOverFilter;
    const controller = new AbortController();
    const requestKey = JSON.stringify({
      drilldown: activeSlideOverFilter,
      selectedDialect,
      selectedEtymology,
    });
    activeDrilldownKeyRef.current = requestKey;
    setSlideOverLoading(true);
    setSlideOverLoadingMore(false);

    async function loadDrilldownPage() {
      try {
        const response = await fetch(
          buildAnalyticsDrilldownUrl({
            drilldown: activeSlideOverFilter,
            limit: ANALYTICS_DRILLDOWN_PAGE_SIZE,
            offset: 0,
            selectedDialect,
            selectedEtymology,
          }),
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Analytics drilldown is unavailable");
        }

        const page = (await response.json()) as AnalyticsDrilldownPage;
        if (
          controller.signal.aborted ||
          activeDrilldownKeyRef.current !== requestKey
        ) {
          return;
        }

        setSlideOverDictionaryLength(page.totalEntries);
        setSlideOverResults(page.entries);
        setSlideOverTotalMatches(page.totalMatches);
        setHasMoreSlideOverResults(page.hasMore);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.warn("Analytics drilldown data is unavailable.", error);
        if (activeDrilldownKeyRef.current !== requestKey) {
          return;
        }

        setSlideOverDictionaryLength(0);
        setSlideOverResults([]);
        setSlideOverTotalMatches(0);
        setHasMoreSlideOverResults(false);
      } finally {
        if (
          controller.signal.aborted ||
          activeDrilldownKeyRef.current !== requestKey
        ) {
          return;
        }

        setSlideOverLoading(false);
      }
    }

    void loadDrilldownPage();

    return () => {
      controller.abort();
    };
  }, [selectedDialect, selectedEtymology, slideOverFilter]);

  const loadMoreSlideOverResults = () => {
    if (
      !slideOverFilter ||
      isSlideOverLoading ||
      isSlideOverLoadingMore ||
      !hasMoreSlideOverResults
    ) {
      return;
    }

    const activeSlideOverFilter = slideOverFilter;
    const requestKey = activeDrilldownKeyRef.current;
    setSlideOverLoadingMore(true);

    async function loadNextPage() {
      try {
        const response = await fetch(
          buildAnalyticsDrilldownUrl({
            drilldown: activeSlideOverFilter,
            limit: ANALYTICS_DRILLDOWN_PAGE_SIZE,
            offset: slideOverResults.length,
            selectedDialect,
            selectedEtymology,
          }),
        );
        if (!response.ok) {
          throw new Error("Analytics drilldown page is unavailable");
        }

        const page = (await response.json()) as AnalyticsDrilldownPage;
        if (activeDrilldownKeyRef.current !== requestKey) {
          return;
        }

        setSlideOverDictionaryLength(page.totalEntries);
        setSlideOverResults((previousResults) =>
          activeDrilldownKeyRef.current === requestKey
            ? [...previousResults, ...page.entries]
            : previousResults,
        );
        setSlideOverTotalMatches(page.totalMatches);
        setHasMoreSlideOverResults(page.hasMore);
      } catch (error) {
        console.warn(
          "Analytics drilldown results could not be extended.",
          error,
        );
      } finally {
        if (activeDrilldownKeyRef.current === requestKey) {
          setSlideOverLoadingMore(false);
        }
      }
    }

    void loadNextPage();
  };

  const handleStatClick = (type: "total" | "unknown" | "uncertain") => {
    setSlideOverFilter(
      buildAnalyticsStatDrilldown({
        totalTitle: t("analytics.totalRoots"),
        type,
        uncertainTitle: t("analytics.meaningUncertain"),
        unknownTitle: t("analytics.meaningUnknown"),
      }),
    );
  };

  const handleChartClick = (data: unknown, type: string) => {
    if (!isAnalyticsChartClickPayload(data) || !data.payload?.originalName) {
      return;
    }
    setSlideOverFilter(
      buildAnalyticsChartDrilldown({
        originalName: data.payload.originalName,
        title: data.name ?? data.payload.originalName,
        type: type as
          | "derivation"
          | "etymology"
          | "gender"
          | "pos"
          | "relations"
          | "verb",
      }),
    );
  };

  const posChartData = useMemo(
    () =>
      stats.posChartData.map((datum) => ({
        ...datum,
        originalName: datum.name,
        name:
          t(`dict.${datum.name.toLowerCase()}` as TranslationKey) ?? datum.name,
      })),
    [stats.posChartData, t],
  );
  const genderChartData = useMemo(
    () =>
      stats.genderChartData.map((datum) => ({
        ...datum,
        originalName: datum.name,
        name: datum.name,
      })),
    [stats.genderChartData],
  );
  const etymologyChartData = useMemo(
    () =>
      stats.etymologyChartData.map((datum) => ({
        ...datum,
        originalName: datum.name,
        name: t(datum.name as TranslationKey),
      })),
    [stats.etymologyChartData, t],
  );
  const derivationChartData = useMemo(
    () =>
      stats.derivationalMorphologyData.map((datum) => ({
        ...datum,
        originalName: datum.name,
        name: t(datum.name as TranslationKey),
      })),
    [stats.derivationalMorphologyData, t],
  );
  const verbChartData = useMemo(
    () =>
      stats.verbCompletenessData.map((datum) => ({
        ...datum,
        originalName: datum.name,
        name: t(datum.name as TranslationKey),
      })),
    [stats.verbCompletenessData, t],
  );
  const relationChartData = useMemo(
    () =>
      stats.relationTypeData.map((datum) => ({
        ...datum,
        originalName: datum.name,
        name: t(datum.name as TranslationKey),
      })),
    [stats.relationTypeData, t],
  );

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 pb-20 md:p-10"
      contentClassName="w-full pt-10"
      width="standard"
      accents={[
        pageShellAccents.heroEmeraldArc,
        pageShellAccents.topRightSkyOrbInset,
      ]}
    >
      <div className="mb-10 space-y-8">
        <BreadcrumbTrail
          items={[
            { label: t("nav.home"), href: getLocalizedHomePath(language) },
            { label: t("nav.dictionary"), href: getDictionaryPath(language) },
            { label: t("nav.analytics") },
          ]}
        />

        <PageHeader
          title={t("analytics.title")}
          align="left"
          size="compact"
          tone="analytics"
        />

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Link
              href={getDictionaryPath(language)}
              className={buttonClassName({ variant: "secondary" })}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("analytics.back")}
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <SurfacePanel
              variant="subtle"
              shadow="soft"
              className="flex items-center space-x-3 rounded-2xl p-3 px-4 dark:border-stone-700"
            >
              <span className="inline-flex items-center whitespace-nowrap text-stone-500 dark:text-stone-400">
                <Filter className="h-4 w-4" />
              </span>
              <CompactSelect
                label={t("analytics.filter")}
                value={selectedDialect}
                onChange={(e) =>
                  setSelectedDialect(e.target.value as AnalyticsDialect)
                }
                className="text-stone-700 dark:text-stone-200"
              >
                {dialectFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getDialectFilterOptionLabel(option.value, t)}
                  </option>
                ))}
              </CompactSelect>
            </SurfacePanel>

            <SurfacePanel
              variant="subtle"
              shadow="soft"
              className="flex items-center space-x-3 rounded-2xl p-3 px-4 dark:border-stone-700"
            >
              <CompactSelect
                label={t("analytics.filterEtymology" as TranslationKey)}
                value={selectedEtymology}
                onChange={(e) =>
                  setSelectedEtymology(e.target.value as EtymologyFilter)
                }
                className="text-stone-700 dark:text-stone-200"
              >
                <option value="ALL">
                  {t("analytics.filterEtymologyAll" as TranslationKey)}
                </option>
                <option value="Egy">
                  {t("analytics.filterEtymologyEgy" as TranslationKey)}
                </option>
                <option value="Gr">
                  {t("analytics.filterEtymologyGr" as TranslationKey)}
                </option>
              </CompactSelect>
            </SurfacePanel>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <AnalyticsStatCard
          accentClassName="bg-[rgb(var(--accent)/0.12)]"
          title={t("analytics.totalRoots")}
          value={stats.totalRoots.toLocaleString()}
          onClick={() => handleStatClick("total")}
        />
        <AnalyticsStatCard
          accentClassName="bg-[rgb(var(--warning)/0.12)]"
          title={t("analytics.meaningUnknown")}
          value={stats.unknownMeaning.toLocaleString()}
          valueClassName="text-4xl font-bold"
          onClick={() => handleStatClick("unknown")}
        />
        <AnalyticsStatCard
          accentClassName="bg-[rgb(var(--danger)/0.12)]"
          title={t("analytics.meaningUncertain")}
          value={stats.uncertainMeaning.toLocaleString()}
          valueClassName="text-4xl font-bold"
          onClick={() => handleStatClick("uncertain")}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
        <AnalyticsPieChartCard
          title={t("analytics.posBreakdown")}
          data={posChartData}
          palette={colors.palettes.pos}
          chartCellStroke={colors.chartCellStroke}
          isThemeReady={isThemeReady}
          tooltipContentStyle={colors.tooltipContentStyle}
          tooltipItemStyle={colors.tooltipItemStyle}
          onSliceClick={(data) => handleChartClick(data, "pos")}
        />

        <AnalyticsPieChartCard
          title={
            <>
              {t("analytics.nounGenders")}{" "}
              <span className="text-lg font-normal text-stone-500">
                ({stats.totalNouns} {t("analytics.total")})
              </span>
            </>
          }
          footer={
            <div className="mt-auto rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 shadow-sm dark:border-stone-800/50 dark:bg-stone-950/40">
              <li className="mb-2 flex list-none items-center justify-between text-sm text-[rgb(var(--accent-strong))]">
                <span>{t("analytics.verbalNouns")}</span>
                <span className="font-bold">{stats.verbalNouns}</span>
              </li>
              <div className="my-2 h-px w-full bg-stone-300 dark:bg-stone-800"></div>
              <div className="flex justify-between font-bold text-stone-700 dark:text-stone-300">
                <span>{t("analytics.totalMasculine")}</span>
                <span>{stats.totalMasculine}</span>
              </div>
            </div>
          }
          data={genderChartData}
          palette={colors.palettes.gender}
          chartCellStroke={colors.chartCellStroke}
          isThemeReady={isThemeReady}
          tooltipContentStyle={colors.tooltipContentStyle}
          tooltipItemStyle={colors.tooltipItemStyle}
          animationBegin={200}
          onSliceClick={(data) => handleChartClick(data, "gender")}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
        <AnalyticsPieChartCard
          title={t("analytics.etymology" as TranslationKey)}
          data={etymologyChartData}
          palette={colors.palettes.etymology}
          chartCellStroke={colors.chartCellStroke}
          isThemeReady={isThemeReady}
          tooltipContentStyle={colors.tooltipContentStyle}
          tooltipItemStyle={colors.tooltipItemStyle}
          animationBegin={300}
          onSliceClick={(data) => handleChartClick(data, "etymology")}
        />

        <AnalyticsPieChartCard
          title={t("analytics.derivation" as TranslationKey)}
          data={derivationChartData}
          palette={colors.palettes.derivation}
          chartCellStroke={colors.chartCellStroke}
          isThemeReady={isThemeReady}
          tooltipContentStyle={colors.tooltipContentStyle}
          tooltipItemStyle={colors.tooltipItemStyle}
          animationBegin={400}
          onSliceClick={(data) => handleChartClick(data, "derivation")}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <AnalyticsPieChartCard
          title={t("analytics.verbCompleteness" as TranslationKey)}
          data={verbChartData}
          palette={colors.palettes.verb}
          chartCellStroke={colors.chartCellStroke}
          isThemeReady={isThemeReady}
          tooltipContentStyle={colors.tooltipContentStyle}
          tooltipItemStyle={colors.tooltipItemStyle}
          animationBegin={500}
          onSliceClick={(data) => handleChartClick(data, "verb")}
        />

        <AnalyticsPieChartCard
          title={t("analytics.relations" as TranslationKey)}
          data={relationChartData}
          palette={colors.palettes.relations}
          chartCellStroke={colors.chartCellStroke}
          isThemeReady={isThemeReady}
          tooltipContentStyle={colors.tooltipContentStyle}
          tooltipItemStyle={colors.tooltipItemStyle}
          animationBegin={600}
          onSliceClick={(data) => handleChartClick(data, "relations")}
        />
      </div>

      <AnalyticsSlideOver
        isOpen={!!slideOverFilter}
        onClose={() => setSlideOverFilter(null)}
        title={slideOverFilter?.title ?? "Details"}
      >
        <DictionaryResultsSection
          dictionaryLength={slideOverDictionaryLength}
          filteredResults={slideOverResults}
          hasMoreResults={hasMoreSlideOverResults}
          loading={Boolean(slideOverFilter) && isSlideOverLoading}
          loadingMore={isSlideOverLoadingMore}
          onLoadMore={loadMoreSlideOverResults}
          query=""
          selectedDialect={selectedDialect}
          selectedPartOfSpeech="ALL"
          scrollContainerId="analytics-slideover-scroll"
          totalMatches={slideOverTotalMatches}
        />
      </AnalyticsSlideOver>
    </PageShell>
  );
}
