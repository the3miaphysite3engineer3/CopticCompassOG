"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/Badge";
import { cx } from "@/lib/classes";

type AdminFilterToggleProps = {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
};

export function AdminFilterToggle({
  active,
  count,
  label,
  onClick,
}: AdminFilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
          : "border-stone-200 bg-white/70 text-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-900/70",
      )}
    >
      {label}: {count}
    </button>
  );
}

export function AdminFilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function formatOverflowLabel(count: number, label: string) {
  return count === 1 ? `1 more ${label}` : `${count} more ${label}s`;
}

export function AdminOverflowDisclosure({
  badgeTone = "surface",
  children,
  count,
  label,
}: {
  badgeTone?: "surface" | "flat";
  children: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <details className="group rounded-3xl border border-dashed border-stone-200 bg-stone-50/70 p-4 dark:border-stone-700 dark:bg-stone-950/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-2 py-1 text-sm font-medium text-stone-600 [&::-webkit-details-marker]:hidden dark:text-stone-300">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={badgeTone} size="xs">
            {formatOverflowLabel(count, label)}
          </Badge>
          <span className="group-open:hidden">Show the rest</span>
          <span className="hidden group-open:inline">Hide extra items</span>
        </div>

        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="mt-4 space-y-6">{children}</div>
    </details>
  );
}
