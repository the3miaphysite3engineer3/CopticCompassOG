import { Delete, X } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";
import { antinoou } from "@/lib/fonts";

const COPTIC_LETTERS = [
  "ⲁ",
  "ⲃ",
  "ⲅ",
  "ⲇ",
  "ⲉ",
  "ⲋ",
  "ⲍ",
  "ⲏ",
  "ⲑ",
  "ⲓ",
  "ⲕ",
  "ⲗ",
  "ⲙ",
  "ⲛ",
  "ⲝ",
  "ⲟ",
  "ⲡ",
  "ⲣ",
  "ⲥ",
  "ⲧ",
  "ⲩ",
  "ⲫ",
  "ⲭ",
  "ⲯ",
  "ⲱ",
  "ϣ",
  "ϥ",
  "ⳳ",
  "ϩ",
  "ϫ",
  "ϭ",
  "ϯ",
];

/**
 * Keep diacritics separate so users can compose them onto the previous base
 * letter instead of choosing from every possible precombined glyph.
 */
const DIACRITICS = [
  { char: "\u0300", label: "̀  (Jinkim)" },
  { char: "\u0304", label: "̄  (Stroke)" },
  { char: "\u0308", label: "̈  (Diaeresis)" },
];

interface CopticKeyboardProps {
  onAppend: (char: string) => void;
  onBackspace: () => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Renders the on-screen Coptic keyboard used by dictionary search inputs,
 * including separate diacritics and a backspace control.
 */
export default function CopticKeyboard({
  onAppend,
  onBackspace,
  isOpen,
  onClose,
}: CopticKeyboardProps) {
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] max-h-[70vh] w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-stone-700/80 dark:bg-stone-900/92 sm:rounded-3xl sm:p-4 md:w-[640px] md:p-5">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div>
          <h3 className="text-stone-600 dark:text-stone-300 font-semibold text-sm tracking-widest uppercase">
            {t("dict.keyboardTitle")}
          </h3>
          <p className="mt-1 hidden text-xs text-stone-400 dark:text-stone-500 sm:block">
            {t("dict.keyboardDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("dict.keyboardClose")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-700 dark:bg-stone-800/70 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-8 gap-1.5 sm:mb-4 sm:gap-2.5">
        {COPTIC_LETTERS.map((char) => (
          <button
            type="button"
            key={char}
            onClick={() => onAppend(char)}
            className="flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-100/80 font-coptic text-xl text-stone-700 shadow-sm transition-colors hover:bg-sky-100 hover:text-sky-700 active:scale-95 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-200 dark:hover:bg-sky-600/50 dark:hover:text-white sm:h-12 sm:rounded-xl sm:text-2xl"
          >
            {char}
          </button>
        ))}
      </div>

      <div className="mb-2 flex gap-1.5 sm:mb-2.5 sm:gap-2.5">
        {DIACRITICS.map((d) => (
          <button
            type="button"
            key={d.label}
            onClick={() => onAppend(d.char)}
            className="flex h-10 flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-base text-stone-700 transition-colors hover:bg-emerald-100 active:scale-95 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-stone-300 dark:hover:bg-emerald-900/60 sm:h-11 sm:rounded-xl sm:text-lg"
            title={t("dict.keyboardCombine")}
          >
            <span
              className={`${antinoou.className} mr-1 inline-flex items-center text-lg leading-none opacity-60 sm:mr-2 sm:text-xl`}
            >
              {`◌${d.char}`}
            </span>
            <span className="text-[11px] font-sans font-medium text-emerald-600 dark:text-emerald-500/80 sm:text-xs">
              {d.label.replace(d.char, "").trim()}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={onBackspace}
          className="flex h-10 flex-1 flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 active:scale-95 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 sm:h-11 sm:rounded-xl"
          aria-label={t("dict.keyboardBackspace")}
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
      <div className="flex">
        <button
          type="button"
          onClick={() => onAppend(" ")}
          className="flex h-10 w-full items-center justify-center rounded-lg border border-stone-300 bg-stone-200 text-sm font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:bg-stone-300 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 sm:h-11 sm:rounded-xl"
        >
          {t("dict.keyboardSpace")}
        </button>
      </div>
    </div>
  );
}
