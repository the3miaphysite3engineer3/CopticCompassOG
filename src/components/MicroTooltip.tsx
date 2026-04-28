import { cx } from "@/lib/classes";

import type { CSSProperties, ReactNode } from "react";

type MicroTooltipProps = {
  alignItems?: "baseline" | "center";
  bubbleClassName?: string;
  children: ReactNode;
  className?: string;
  label: string;
};

export const microTooltipBubbleClassName =
  "max-w-64 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-center font-sans text-[11px] font-medium leading-snug normal-case tracking-normal text-stone-700 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200";

export const tooltipArrowClassName =
  "border-r border-b border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900";

export const richTooltipBubbleClassName =
  "max-w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-stone-700 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200";

export const interactiveTooltipBubbleClassName =
  "w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-stone-200 bg-white px-3 py-3 text-center text-xs leading-5 text-stone-700 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200";

export const chartTooltipContentBaseStyle = {
  borderRadius: "8px",
  borderStyle: "solid",
  borderWidth: 1,
  boxShadow:
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  fontSize: "12px",
  lineHeight: 1.35,
  padding: "8px 10px",
} satisfies CSSProperties;

export const chartTooltipItemBaseStyle = {
  fontWeight: 500,
  paddingBlock: "1px",
} satisfies CSSProperties;

export const chartTooltipLabelBaseStyle = {
  fontWeight: 700,
  marginBlockEnd: "4px",
} satisfies CSSProperties;

/**
 * Provides the compact explanatory tooltip treatment used by dictionary
 * abbreviations, form symbols, and small metadata labels.
 */
export function MicroTooltip({
  alignItems = "baseline",
  bubbleClassName,
  children,
  className,
  label,
}: MicroTooltipProps) {
  return (
    <span
      aria-label={label}
      className={cx(
        "group/micro-tooltip relative inline-flex cursor-help focus:outline-none",
        alignItems === "center" ? "items-center" : "items-baseline",
        className,
      )}
      tabIndex={0}
    >
      {children}
      <span
        className={cx(
          "pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-max -translate-x-1/2 group-hover/micro-tooltip:block group-focus-visible/micro-tooltip:block",
          microTooltipBubbleClassName,
          bubbleClassName,
        )}
      >
        {label}
      </span>
    </span>
  );
}
