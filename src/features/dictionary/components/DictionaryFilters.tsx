"use client";

import { SlidersHorizontal } from "lucide-react";

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

      <CompactSelect
        label={t("dict.pos")}
        value={selectedPartOfSpeech}
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
        label={t("dict.exactMatch") || "Exact Match"}
        labelClassName="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400"
        onChange={(event) => setExactMatch(event.target.checked)}
        wrapperClassName="-m-2 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
      />
    </div>
  );
}
