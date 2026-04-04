"use client";

import { useState, type CSSProperties, type ReactNode, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Filter } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { buttonClassName } from "@/components/Button";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { CompactSelect } from "@/components/CompactSelect";
import {
  type AnalyticsSnapshotMap,
  type EtymologyFilter,
} from "@/features/analytics/lib/analytics";
import { FormLabel } from "@/components/FormField";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import { cx } from "@/lib/classes";
import { getDictionaryPath, getLocalizedHomePath } from "@/lib/locale";
import {
  type AnalyticsDialect,
  dialectFilterOptions,
  getDialectFilterOptionLabel,
} from "@/features/dictionary/config";
import type { TranslationKey } from "@/lib/i18n";
import type { LexicalEntry } from "@/features/dictionary/types";
import { AnalyticsSlideOver } from "./AnalyticsSlideOver";
import { DictionaryResultsSection } from "@/features/dictionary/components/DictionaryResultsSection";

const COLOR_FALLBACKS = {
  surface: "#ffffff",
  line: "#e5e5e5",
  ink: "#1c1917",
  accent: "#38bdf8",
  accentStrong: "#0284c7",
  warning: "#d97706",
  danger: "#dc2626",
  chart1: "#38bdf8",
  chart2: "#34d399",
  chart3: "#f472b6",
  chart4: "#fbbf24",
  chart5: "#a78bfa",
  chart6: "#f87171",
  chart7: "#a8a29e",
} as const;

function readThemeColor(token: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${token}`)
    .trim();

  return value ? `rgb(${value})` : fallback;
}

const CHART_LEGEND_STYLE = {
  fontSize: "12px",
  paddingTop: "20px",
} satisfies CSSProperties;
type AnalyticsStatCardProps = {
  accentClassName: string;
  title: string;
  value: string;
  valueClassName?: string;
  onClick?: () => void;
};

type AnalyticsChartCardProps = {
  children: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
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

function AnalyticsChartCard({
  children,
  footer,
  title,
}: AnalyticsChartCardProps) {
  return (
    <SurfacePanel
      rounded="3xl"
      shadow="soft"
      className="flex h-full flex-col p-6"
    >
      <h2 className="mb-6 border-b border-stone-200 pb-3 text-2xl font-bold text-stone-800 dark:border-stone-800 dark:text-stone-300">
        {title}
      </h2>
      {children}
      {footer}
    </SurfacePanel>
  );
}

type SlideOverPredicate = {
  title: string;
  predicate: (entry: LexicalEntry) => boolean;
};

type AnalyticsPageClientProps = {
  snapshots: AnalyticsSnapshotMap;
  dictionary: LexicalEntry[];
};

export default function AnalyticsPageClient({
  snapshots,
  dictionary,
}: AnalyticsPageClientProps) {
  const [selectedDialect, setSelectedDialect] = useState<AnalyticsDialect>("B");
  const [selectedEtymology, setSelectedEtymology] =
    useState<EtymologyFilter>("ALL");
  const [slideOverFilter, setSlideOverFilter] =
    useState<SlideOverPredicate | null>(null);

  const { resolvedTheme } = useTheme();
  const { language, t } = useLanguage();
  const stats =
    snapshots[selectedDialect]?.[selectedEtymology] ?? snapshots.ALL.ALL;
  const isThemeReady = resolvedTheme !== undefined;
  const isDark = resolvedTheme === "dark";

  const colors = useMemo(() => {
    const surface = readThemeColor("surface", COLOR_FALLBACKS.surface);
    const line = readThemeColor("line", COLOR_FALLBACKS.line);
    const ink = readThemeColor("ink", COLOR_FALLBACKS.ink);
    const accentStrong = readThemeColor(
      "accent-strong",
      COLOR_FALLBACKS.accentStrong,
    );
    const warning = readThemeColor("warning", COLOR_FALLBACKS.warning);
    const danger = readThemeColor("danger", COLOR_FALLBACKS.danger);

    return {
      accentStrong,
      chartCellStroke: surface,
      danger,
      palettes: {
        derivation: [
          readThemeColor("chart-5", COLOR_FALLBACKS.chart5),
          readThemeColor("chart-1", COLOR_FALLBACKS.chart1),
          readThemeColor("chart-4", COLOR_FALLBACKS.chart4),
          readThemeColor("chart-3", COLOR_FALLBACKS.chart3),
          readThemeColor("chart-7", COLOR_FALLBACKS.chart7),
        ],
        etymology: [
          readThemeColor("chart-4", COLOR_FALLBACKS.chart4),
          readThemeColor("chart-1", COLOR_FALLBACKS.chart1),
        ],
        gender: [
          readThemeColor("chart-1", COLOR_FALLBACKS.chart1),
          readThemeColor("chart-3", COLOR_FALLBACKS.chart3),
          readThemeColor("chart-2", COLOR_FALLBACKS.chart2),
          readThemeColor("chart-7", COLOR_FALLBACKS.chart7),
        ],
        pos: [
          readThemeColor("chart-1", COLOR_FALLBACKS.chart1),
          readThemeColor("chart-2", COLOR_FALLBACKS.chart2),
          readThemeColor("chart-3", COLOR_FALLBACKS.chart3),
          readThemeColor("chart-4", COLOR_FALLBACKS.chart4),
          readThemeColor("chart-5", COLOR_FALLBACKS.chart5),
          readThemeColor("chart-6", COLOR_FALLBACKS.chart6),
          readThemeColor("chart-7", COLOR_FALLBACKS.chart7),
        ],
        relations: [
          readThemeColor("chart-1", COLOR_FALLBACKS.chart1),
          readThemeColor("chart-5", COLOR_FALLBACKS.chart5),
        ],
        verb: [
          readThemeColor("chart-2", COLOR_FALLBACKS.chart2),
          readThemeColor("chart-3", COLOR_FALLBACKS.chart3),
        ],
      },
      tooltipContentStyle: {
        backgroundColor: surface,
        borderColor: line,
        borderRadius: "12px",
        color: ink,
      } satisfies CSSProperties,
      tooltipItemStyle: {
        color: ink,
      } satisfies CSSProperties,
      warning,
    };
  }, [resolvedTheme]);

  const chartPlaceholder = (
    <div className="h-full w-full rounded-2xl bg-stone-100/70 dark:bg-stone-900/40" />
  );

  const handleStatClick = (type: "total" | "unknown" | "uncertain") => {
    let title = "";
    let predicate: (e: LexicalEntry) => boolean = () => true;

    if (type === "total") {
      title = t("analytics.totalRoots");
      predicate = () => true;
    } else if (type === "unknown") {
      title = t("analytics.meaningUnknown");
      predicate = (e) =>
        e.english_meanings.join(" ").toLowerCase().includes("meaning unknown");
    } else if (type === "uncertain") {
      title = t("analytics.meaningUncertain");
      predicate = (e) =>
        e.english_meanings
          .join(" ")
          .toLowerCase()
          .includes("meaning uncertain");
    }

    setSlideOverFilter({ title, predicate });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (data: any, type: string) => {
    if (!data?.payload?.originalName) return;
    const title = data.name;
    const originalName = data.payload.originalName;

    let predicate: (e: LexicalEntry) => boolean = () => true;

    if (type === "pos") {
      predicate = (e) => {
        if (originalName === "Verbs") return e.pos === "V";
        if (originalName === "Nouns") return e.pos === "N";
        if (originalName === "Adjectives") return e.pos === "ADJ";
        if (originalName === "Adverbs") return e.pos === "ADV";
        if (originalName === "Conjunctions") return e.pos === "CONJ";
        if (originalName === "Prepositions") return e.pos === "PREP";
        return e.pos === "OTHER" || e.pos === "INTERJ" || e.pos === "UNKNOWN";
      };
    } else if (type === "gender") {
      predicate = (e) => {
        if (e.pos !== "N") return false;
        if (originalName.startsWith("Masculine")) return e.gender === "M";
        if (originalName.startsWith("Feminine")) return e.gender === "F";
        if (originalName.startsWith("Epicene")) return e.gender === "BOTH";
        return e.gender === "";
      };
    } else if (type === "etymology") {
      predicate = (e) => {
        return originalName === "analytics.grEtymology"
          ? e.etymology === "Gr"
          : e.etymology !== "Gr";
      };
    } else if (type === "derivation") {
      predicate = (e) => {
        if (e.pos !== "N") return false;
        const hw = e.headword.toLowerCase();
        if (originalName === "analytics.prefixAbstract")
          return hw.startsWith("ⲙⲉⲧ") || hw.startsWith("ⲙⲛⲧ");
        if (originalName === "analytics.prefixAgent")
          return (
            hw.startsWith("ⲣⲉϥ") || hw.startsWith("ⲣⲉⲙ") || hw.startsWith("ⲣⲙ")
          );
        if (originalName === "analytics.prefixAction")
          return hw.startsWith("ϫⲓⲛ") || hw.startsWith("ϭⲓⲛ");
        if (originalName === "analytics.prefixPrivative")
          return hw.startsWith("ⲁⲧ") || hw.startsWith("ⲁⲑ");
        return !(
          hw.startsWith("ⲙⲉⲧ") ||
          hw.startsWith("ⲙⲛⲧ") ||
          hw.startsWith("ⲣⲉϥ") ||
          hw.startsWith("ⲣⲉⲙ") ||
          hw.startsWith("ⲣⲙ") ||
          hw.startsWith("ϫⲓⲛ") ||
          hw.startsWith("ϭⲓⲛ") ||
          hw.startsWith("ⲁⲧ") ||
          hw.startsWith("ⲁⲑ")
        );
      };
    } else if (type === "verb") {
      predicate = (e) => {
        if (e.pos !== "V") return false;
        const hasAnyStative = Object.values(e.dialects).some((d) => d?.stative);
        return originalName === "analytics.hasStative"
          ? hasAnyStative
          : !hasAnyStative;
      };
    } else if (type === "relations") {
      predicate = (e) => {
        return originalName === "analytics.baseRoots"
          ? !e.relationType
          : !!e.relationType;
      };
    }

    setSlideOverFilter({ title, predicate });
  };

  const slideOverResults = useMemo(() => {
    if (!slideOverFilter) return [];

    // First apply dialect and etymology dashboard filters
    let base = dictionary;
    if (selectedDialect !== "ALL") {
      base = base.filter((e) => e.dialects[selectedDialect] !== undefined);
    }
    if (selectedEtymology !== "ALL") {
      base = base.filter((e) =>
        selectedEtymology === "Gr"
          ? e.etymology === "Gr"
          : e.etymology !== "Gr",
      );
    }

    // Apply the specific pie slice predicate
    return base.filter(slideOverFilter.predicate);
  }, [dictionary, selectedDialect, selectedEtymology, slideOverFilter]);

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
        <AnalyticsChartCard title={t("analytics.posBreakdown")}>
          <div className="h-[300px] w-full mb-6">
            {isThemeReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={colors.tooltipContentStyle}
                    itemStyle={colors.tooltipItemStyle}
                  />
                  <Legend wrapperStyle={CHART_LEGEND_STYLE} />
                  <Pie
                    data={stats.posChartData.map((d) => ({
                      ...d,
                      originalName: d.name,
                      name:
                        t(("dict." + d.name.toLowerCase()) as TranslationKey) ??
                        d.name,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1200}
                    onClick={(data) => handleChartClick(data, "pos")}
                    className="cursor-pointer"
                  >
                    {stats.posChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.palettes.pos[
                            index % colors.palettes.pos.length
                          ]
                        }
                        stroke={colors.chartCellStroke}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              chartPlaceholder
            )}
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard
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
        >
          <div className="h-[300px] w-full mb-6">
            {isThemeReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={colors.tooltipContentStyle}
                    itemStyle={colors.tooltipItemStyle}
                  />
                  <Legend wrapperStyle={CHART_LEGEND_STYLE} />
                  <Pie
                    data={stats.genderChartData.map((d) => ({
                      ...d,
                      originalName: d.name,
                      name: d.name,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1200}
                    onClick={(data) => handleChartClick(data, "gender")}
                    className="cursor-pointer"
                  >
                    {stats.genderChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.palettes.gender[
                            index % colors.palettes.gender.length
                          ]
                        }
                        stroke={colors.chartCellStroke}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              chartPlaceholder
            )}
          </div>
        </AnalyticsChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
        <AnalyticsChartCard title={t("analytics.etymology" as TranslationKey)}>
          <div className="h-[300px] w-full mb-6">
            {isThemeReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={colors.tooltipContentStyle}
                    itemStyle={colors.tooltipItemStyle}
                  />
                  <Legend wrapperStyle={CHART_LEGEND_STYLE} />
                  <Pie
                    data={stats.etymologyChartData.map((d) => ({
                      ...d,
                      originalName: d.name,
                      name: t(d.name as TranslationKey),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={300}
                    onClick={(data) => handleChartClick(data, "etymology")}
                    className="cursor-pointer"
                  >
                    {stats.etymologyChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.palettes.etymology[
                            index % colors.palettes.etymology.length
                          ]
                        }
                        stroke={colors.chartCellStroke}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              chartPlaceholder
            )}
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard title={t("analytics.derivation" as TranslationKey)}>
          <div className="h-[300px] w-full mb-6">
            {isThemeReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={colors.tooltipContentStyle}
                    itemStyle={colors.tooltipItemStyle}
                  />
                  <Legend wrapperStyle={CHART_LEGEND_STYLE} />
                  <Pie
                    data={stats.derivationalMorphologyData.map((d) => ({
                      ...d,
                      originalName: d.name,
                      name: t(d.name as TranslationKey),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={400}
                    onClick={(data) => handleChartClick(data, "derivation")}
                    className="cursor-pointer"
                  >
                    {stats.derivationalMorphologyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.palettes.derivation[
                            index % colors.palettes.derivation.length
                          ]
                        }
                        stroke={colors.chartCellStroke}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              chartPlaceholder
            )}
          </div>
        </AnalyticsChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <AnalyticsChartCard
          title={t("analytics.verbCompleteness" as TranslationKey)}
        >
          <div className="h-[300px] w-full mb-6">
            {isThemeReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={colors.tooltipContentStyle}
                    itemStyle={colors.tooltipItemStyle}
                  />
                  <Legend wrapperStyle={CHART_LEGEND_STYLE} />
                  <Pie
                    data={stats.verbCompletenessData.map((d) => ({
                      ...d,
                      originalName: d.name,
                      name: t(d.name as TranslationKey),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={500}
                    onClick={(data) => handleChartClick(data, "verb")}
                    className="cursor-pointer"
                  >
                    {stats.verbCompletenessData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.palettes.verb[
                            index % colors.palettes.verb.length
                          ]
                        }
                        stroke={colors.chartCellStroke}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              chartPlaceholder
            )}
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard title={t("analytics.relations" as TranslationKey)}>
          <div className="h-[300px] w-full mb-6">
            {isThemeReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={colors.tooltipContentStyle}
                    itemStyle={colors.tooltipItemStyle}
                  />
                  <Legend wrapperStyle={CHART_LEGEND_STYLE} />
                  <Pie
                    data={stats.relationTypeData.map((d) => ({
                      ...d,
                      originalName: d.name,
                      name: t(d.name as TranslationKey),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={600}
                    onClick={(data) => handleChartClick(data, "relations")}
                    className="cursor-pointer"
                  >
                    {stats.relationTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.palettes.relations[
                            index % colors.palettes.relations.length
                          ]
                        }
                        stroke={colors.chartCellStroke}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              chartPlaceholder
            )}
          </div>
        </AnalyticsChartCard>
      </div>

      <AnalyticsSlideOver
        isOpen={!!slideOverFilter}
        onClose={() => setSlideOverFilter(null)}
        title={slideOverFilter?.title ?? "Details"}
      >
        <DictionaryResultsSection
          dictionaryLength={dictionary.length}
          filteredResults={slideOverResults}
          loading={false}
          query=""
          selectedDialect={selectedDialect}
          selectedPartOfSpeech="ALL"
          scrollContainerId="analytics-slideover-scroll"
        />
      </AnalyticsSlideOver>
    </PageShell>
  );
}
