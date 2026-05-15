"use client";

import { Keyboard, Search, X } from "lucide-react";

import { iconButtonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { cx } from "@/lib/classes";
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
    <div className="group relative z-30 rounded-lg border border-line bg-surface/92 shadow-panel backdrop-blur-xl">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted transition-colors group-focus-within:text-coptic sm:left-6">
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
          className={`${antinoou.className} w-full rounded-lg bg-transparent p-4 pl-12 pr-24 text-base text-ink transition-all placeholder:font-sans placeholder:text-muted/65 focus:outline-none focus:ring-2 focus:ring-accent/30 sm:p-6 sm:pl-16 sm:pr-28 sm:text-lg md:text-2xl`}
        />

        <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 sm:right-4 sm:gap-2">
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className={iconButtonClassName({
                className: "h-9 w-9 border-transparent sm:h-10 sm:w-10",
              })}
              aria-label={t("dict.clearSearch")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleKeyboard}
            className={iconButtonClassName({
              className: cx(
                "h-9 w-9 border-transparent sm:h-10 sm:w-10",
                isKeyboardOpen &&
                  "border-coptic/25 bg-coptic-soft text-coptic hover:border-coptic/35 hover:bg-coptic-soft hover:text-coptic",
              ),
            })}
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
