"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { SurfacePanel } from "@/components/SurfacePanel";

import type { CSSProperties, ReactNode } from "react";

const CHART_LEGEND_STYLE = {
  fontSize: "12px",
  paddingTop: "20px",
} satisfies CSSProperties;

type AnalyticsPieChartCardProps = {
  chartCellStroke: string;
  data: Array<Record<string, unknown>>;
  footer?: ReactNode;
  isThemeReady: boolean;
  onSliceClick: (data: unknown) => void;
  palette: string[];
  title: ReactNode;
  tooltipContentStyle: CSSProperties;
  tooltipItemStyle: CSSProperties;
  animationBegin?: number;
};

export function AnalyticsPieChartCard({
  animationBegin = 0,
  chartCellStroke,
  data,
  footer,
  isThemeReady,
  onSliceClick,
  palette,
  title,
  tooltipContentStyle,
  tooltipItemStyle,
}: AnalyticsPieChartCardProps) {
  const chartPlaceholder = (
    <div className="h-full w-full rounded-2xl bg-stone-100/70 dark:bg-stone-900/40" />
  );

  return (
    <SurfacePanel
      rounded="3xl"
      shadow="soft"
      className="flex h-full flex-col p-6"
    >
      <h2 className="mb-6 border-b border-stone-200 pb-3 text-2xl font-bold text-stone-800 dark:border-stone-800 dark:text-stone-300">
        {title}
      </h2>

      <div className="mb-6 h-[300px] w-full">
        {isThemeReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={tooltipContentStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend wrapperStyle={CHART_LEGEND_STYLE} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                animationBegin={animationBegin}
                animationDuration={1200}
                onClick={onSliceClick}
                className="cursor-pointer"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={palette[index % palette.length]}
                    stroke={chartCellStroke}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          chartPlaceholder
        )}
      </div>

      {footer}
    </SurfacePanel>
  );
}
