"use client";

import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import { cx } from "@/lib/classes";

const adminListPrimitivesCopy = {
  en: {
    hideExtra: "Hide extra items",
    showRest: "Show the rest",
  },
  nl: {
    hideExtra: "Extra items verbergen",
    showRest: "De rest tonen",
  },
} as const;

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
  const { language } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        active
          ? "border-accent/25 bg-accent-soft text-accent-strong shadow-sm dark:text-accent"
          : "border-line bg-surface/70 text-muted hover:border-accent/40 hover:bg-elevated hover:text-ink",
      )}
    >
      {label}: {count.toLocaleString(language === "nl" ? "nl-BE" : "en-US")}
    </button>
  );
}

export function AdminFilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function formatOverflowLabel({
  count,
  label,
  language,
  pluralLabel,
}: {
  count: number;
  label: string;
  language: "en" | "nl";
  pluralLabel?: string;
}) {
  const formattedCount = count.toLocaleString(
    language === "nl" ? "nl-BE" : "en-US",
  );

  if (language === "nl") {
    return `${formattedCount} extra ${count === 1 ? label : (pluralLabel ?? label)}`;
  }

  return count === 1
    ? `${formattedCount} more ${label}`
    : `${formattedCount} more ${pluralLabel ?? `${label}s`}`;
}

export function AdminOverflowDisclosure({
  badgeTone = "surface",
  children,
  count,
  label,
  pluralLabel,
}: {
  badgeTone?: "surface" | "flat";
  children: React.ReactNode;
  count: number;
  label: string;
  pluralLabel?: string;
}) {
  const { language } = useLanguage();
  const copy = adminListPrimitivesCopy[language];

  return (
    <details className="group rounded-xl border border-dashed border-line bg-elevated/70 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-2 py-1 text-sm font-medium text-muted [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={badgeTone} size="xs">
            {formatOverflowLabel({ count, label, language, pluralLabel })}
          </Badge>
          <span className="group-open:hidden">{copy.showRest}</span>
          <span className="hidden group-open:inline">{copy.hideExtra}</span>
        </div>

        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="mt-4 space-y-6">{children}</div>
    </details>
  );
}
