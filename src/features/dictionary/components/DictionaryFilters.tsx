"use client";

import { SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { FormLabel } from "@/components/FormField";
import {
  dialectFilterOptions,
  dictionaryPartOfSpeechFilterOptions,
  getDialectFilterOptionLabel,
  type DialectFilter,
  type DictionaryPartOfSpeechFilter,
} from "@/features/dictionary/config";

type DictionaryFiltersProps = {
  selectedDialect: DialectFilter;
  selectedPartOfSpeech: DictionaryPartOfSpeechFilter;
  setSelectedDialect: (value: DialectFilter) => void;
  setSelectedPartOfSpeech: (value: DictionaryPartOfSpeechFilter) => void;
  exactMatch: boolean;
  setExactMatch: (value: boolean) => void;
};

export function DictionaryFilters({
  selectedDialect,
  selectedPartOfSpeech,
  setSelectedDialect,
  setSelectedPartOfSpeech,
  exactMatch,
  setExactMatch,
}: DictionaryFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="relative z-0 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-stone-200 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/60">
      <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
        <SlidersHorizontal className="h-4 w-4" />
        <FormLabel tone="muted">Filters</FormLabel>
      </div>

      <div className="hidden h-6 w-px bg-stone-300 dark:bg-stone-700 md:block" />

      <div className="flex items-center space-x-2">
        <FormLabel tone="muted">{t("dict.pos")}</FormLabel>
        <select
          className="select-base h-auto cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
          value={selectedPartOfSpeech}
          onChange={(event) =>
            setSelectedPartOfSpeech(event.target.value as DictionaryPartOfSpeechFilter)
          }
        >
          {dictionaryPartOfSpeechFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden h-6 w-px bg-stone-300 dark:bg-stone-700 sm:block" />

      <div className="flex items-center space-x-2">
        <FormLabel tone="muted">{t("dict.dialect")}</FormLabel>
        <select
          className="select-base h-auto cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
          value={selectedDialect}
          onChange={(event) => setSelectedDialect(event.target.value as DialectFilter)}
        >
          {dialectFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {getDialectFilterOptionLabel(option.value, t)}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden h-6 w-px bg-stone-300 dark:bg-stone-700 sm:block" />

      <label className="flex cursor-pointer items-center space-x-2 rounded-lg p-1 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800">
        <input
          type="checkbox"
          className="h-4 w-4 transform cursor-pointer rounded border-stone-300 text-sky-600 transition duration-150 ease-in-out focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-900 dark:checked:bg-sky-500"
          checked={exactMatch}
          onChange={(e) => setExactMatch(e.target.checked)}
        />
        <FormLabel tone="muted" className="cursor-pointer mb-0">
          {t("dict.exactMatch") || "Exact Match"}
        </FormLabel>
      </label>
    </div>
  );
}
