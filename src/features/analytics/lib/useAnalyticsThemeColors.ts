import { useTheme } from "next-themes";

import {
  chartTooltipContentBaseStyle,
  chartTooltipItemBaseStyle,
  chartTooltipLabelBaseStyle,
} from "@/components/MicroTooltip";

import type { CSSProperties } from "react";

const COLOR_FALLBACKS = {
  surface: "#ffffff",
  line: "#e5e5e5",
  ink: "#1c1917",
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

/**
 * Reads one CSS custom property from the active theme and falls back to a
 * stable hard-coded color during SSR or before the theme is hydrated.
 */
function readThemeColor(token: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${token}`)
    .trim();

  return value ? `rgb(${value})` : fallback;
}

/**
 * Resolves the chart and tooltip palette used by the analytics dashboard from
 * the current theme tokens.
 */
export function useAnalyticsThemeColors() {
  const { resolvedTheme } = useTheme();
  const surface = readThemeColor("surface", COLOR_FALLBACKS.surface);
  const line = readThemeColor("line", COLOR_FALLBACKS.line);
  const ink = readThemeColor("ink", COLOR_FALLBACKS.ink);
  const accentStrong = readThemeColor(
    "accent-strong",
    COLOR_FALLBACKS.accentStrong,
  );
  const warning = readThemeColor("warning", COLOR_FALLBACKS.warning);
  const danger = readThemeColor("danger", COLOR_FALLBACKS.danger);
  const colors = {
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
      ...chartTooltipContentBaseStyle,
      backgroundColor: surface,
      borderColor: line,
      color: ink,
    } satisfies CSSProperties,
    tooltipItemStyle: {
      ...chartTooltipItemBaseStyle,
      color: ink,
    } satisfies CSSProperties,
    tooltipLabelStyle: {
      ...chartTooltipLabelBaseStyle,
      color: ink,
    } satisfies CSSProperties,
    warning,
  };

  return {
    colors,
    isThemeReady: resolvedTheme !== undefined,
  };
}
