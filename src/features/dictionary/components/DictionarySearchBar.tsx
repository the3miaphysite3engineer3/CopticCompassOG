"use client";

import { Keyboard, Search, X } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";
import { antinoou } from "@/lib/fonts";

import CopticKeyboard from "./CopticKeyboard";

import type { RefObject } from "react";

type DictionarySearchBarProps = {
  isKeyboardOpen: boolean;
  onAppend: (char: string) => void;
  onBackspace: () => void;
  onCloseKeyboard: () => void;
  onQueryChange: (value: string) => void;
  onSelectionChange: (start: number | null, end: number | null) => void;
  onToggleKeyboard: () => void;
  query: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export function DictionarySearchBar({
  isKeyboardOpen,
  onAppend,
  onBackspace,
  onCloseKeyboard,
  onQueryChange,
  onSelectionChange,
  onToggleKeyboard,
  query,
  searchInputRef,
}: DictionarySearchBarProps) {
  const { t } = useLanguage();

  return (
    <div className="group relative z-30 rounded-2xl border border-stone-200 bg-white/80 shadow-xl backdrop-blur-xl dark:border-stone-700/80 dark:bg-stone-900/80 dark:shadow-2xl sm:rounded-[1.75rem]">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-500 transition-colors group-focus-within:text-sky-400 sm:left-6">
          <Search className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <input
          id="dictionary-search-input"
          name="query"
          ref={searchInputRef}
          type="text"
          dir="ltr"
          aria-label={t("dict.searchPlaceholder")}
          enterKeyHint="search"
          placeholder={t("dict.searchPlaceholder")}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onSelectionChange(
              event.target.selectionStart,
              event.target.selectionEnd,
            );
          }}
          onClick={(event) =>
            onSelectionChange(
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
          onFocus={(event) =>
            onSelectionChange(
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
          onKeyUp={(event) =>
            onSelectionChange(
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
          onSelect={(event) =>
            onSelectionChange(
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
          className={`${antinoou.className} w-full rounded-2xl bg-transparent p-4 pl-12 pr-24 text-base text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 placeholder:font-sans placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500 sm:rounded-[1.75rem] sm:p-6 sm:pl-16 sm:pr-28 sm:text-lg md:text-2xl`}
        />

        <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 sm:right-4 sm:gap-2">
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:text-stone-700 dark:bg-stone-800/70 dark:text-stone-400 dark:hover:text-stone-200 sm:h-10 sm:w-10"
              aria-label={t("dict.clearSearch")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleKeyboard}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${
              isKeyboardOpen
                ? "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
                : "bg-stone-100 text-stone-500 hover:text-stone-700 dark:bg-stone-800/70 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
            aria-label={t("dict.keyboardToggle")}
            title={t("dict.keyboardOpen")}
          >
            <Keyboard className="h-5 w-5" />
          </button>
        </div>

        <CopticKeyboard
          isOpen={isKeyboardOpen}
          onClose={onCloseKeyboard}
          onAppend={onAppend}
          onBackspace={onBackspace}
        />
      </div>
    </div>
  );
}
