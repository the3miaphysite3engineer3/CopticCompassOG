"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { CheckboxField } from "@/components/CheckboxField";
import { CompactSelect } from "@/components/CompactSelect";
import { FormLabel } from "@/components/FormField";
import { useLanguage } from "@/components/LanguageProvider";
import {
  dialectFilterOptions,
  dictionaryPartOfSpeechFilterOptions,
  getDialectFilterOptionLabel,
  type DialectFilter,
  type DictionaryPartOfSpeechFilter,
} from "@/features/dictionary/config";
import { cx } from "@/lib/classes";

type DictionaryFiltersProps = {
  exactMatch: boolean;
  onClearFilters?: () => void;
  selectedDialect: DialectFilter;
  selectedPartOfSpeech: DictionaryPartOfSpeechFilter;
  setExactMatch: (value: boolean) => void;
  setSelectedDialect: (value: DialectFilter) => void;
  setSelectedPartOfSpeech: (value: DictionaryPartOfSpeechFilter) => void;
};

export function DictionaryFilters({
  exactMatch,
  onClearFilters,
  selectedDialect,
  selectedPartOfSpeech,
  setExactMatch,
  setSelectedDialect,
  setSelectedPartOfSpeech,
}: DictionaryFiltersProps) {
  const { t } = useLanguage();
  const [isExpandedOnMobile, setIsExpandedOnMobile] = useState(false);
  const activeFilterCount = [
    selectedPartOfSpeech !== "ALL",
    selectedDialect !== "ALL",
    exactMatch,
  ].filter(Boolean).length;
  const mobileToggleLabel = isExpandedOnMobile
    ? t("dict.hideFilters")
    : t("dict.showFilters");

  return (
    <div className="relative z-0 rounded-2xl border border-stone-200 bg-white/60 p-3 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/60 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 sm:p-4">
      <button
        type="button"
        aria-expanded={isExpandedOnMobile}
        aria-label={mobileToggleLabel}
        onClick={() => setIsExpandedOnMobile((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl p-1 text-left text-stone-600 transition-colors hover:bg-stone-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:text-stone-300 dark:hover:bg-stone-800/60 sm:hidden"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            {t("dict.filters")}
          </span>
          {activeFilterCount > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-xs font-semibold text-white dark:bg-sky-500"
              aria-label={`${t("dict.activeFilters")}: ${activeFilterCount}`}
            >
              {activeFilterCount}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cx(
            "h-4 w-4 shrink-0 transition-transform",
            isExpandedOnMobile && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        className={cx(
          "mt-3 flex flex-col gap-3 sm:mt-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4",
          !isExpandedOnMobile && "hidden sm:flex",
        )}
      >
        <div className="hidden items-center gap-2 text-stone-500 dark:text-stone-400 sm:flex">
          <SlidersHorizontal className="h-4 w-4" />
          <FormLabel tone="muted">{t("dict.filters")}</FormLabel>
          {activeFilterCount > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-xs font-semibold text-white dark:bg-sky-500"
              aria-label={`${t("dict.activeFilters")}: ${activeFilterCount}`}
            >
              {activeFilterCount}
            </span>
          ) : null}
        </div>

        <div className="hidden h-6 w-px bg-stone-300 dark:bg-stone-700 md:block" />

        <CompactSelect
          label={t("dict.pos")}
          value={selectedPartOfSpeech}
          wrapperClassName="w-full justify-between sm:w-auto"
          className="min-w-0 flex-1 sm:min-w-40"
          onChange={(event) =>
            setSelectedPartOfSpeech(
              event.target.value as DictionaryPartOfSpeechFilter,
            )
          }
        >
          {dictionaryPartOfSpeechFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </CompactSelect>

        <div className="hidden h-6 w-px bg-stone-300 dark:bg-stone-700 sm:block" />

        <CompactSelect
          label={t("dict.dialect")}
          value={selectedDialect}
          wrapperClassName="w-full justify-between sm:w-auto"
          className="min-w-0 flex-1 sm:min-w-44"
          onChange={(event) =>
            setSelectedDialect(event.target.value as DialectFilter)
          }
        >
          {dialectFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {getDialectFilterOptionLabel(option.value, t)}
            </option>
          ))}
        </CompactSelect>

        <div className="hidden h-6 w-px bg-stone-300 dark:bg-stone-700 sm:block" />

        <CheckboxField
          checked={exactMatch}
          label={t("dict.exactMatch")}
          labelClassName="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400"
          onChange={(event) => setExactMatch(event.target.checked)}
          wrapperClassName="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 sm:-m-2"
        />

        {activeFilterCount > 0 && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="btn-ghost h-9 justify-start px-3 text-xs uppercase tracking-widest sm:justify-center"
          >
            {t("dict.clearFilters")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
