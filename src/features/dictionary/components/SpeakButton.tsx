"use client";

import { useRef, useState } from "react";

import { FloatingTooltip } from "@/components/FloatingTooltip";
import { useLanguage } from "@/components/LanguageProvider";
import { useSpeech } from "@/features/dictionary/hooks/useSpeech";
import { cx } from "@/lib/classes";

interface SpeakButtonProps {
  /** The Coptic text to be spoken */
  copticText: string;
  /** Optional CSS class for custom styling */
  className?: string;
}

/**
 * A button that speaks a Coptic word using phonetic TTS.
 * Renders nothing if the browser doesn't support Web Speech API.
 */
export function SpeakButton({ copticText, className }: SpeakButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useSpeech();
  const { t } = useLanguage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Silently hide on unsupported browsers or empty text
  if (!isSupported || !copticText?.trim()) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents navigating if inside a link wrapper
    e.stopPropagation();
    setIsHovered(false);
    if (isSpeaking) {
      stop();
    } else {
      speak(copticText);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        title={isSpeaking ? "Stop pronunciation" : "Hear pronunciation"}
        aria-label={
          isSpeaking
            ? "Stop pronunciation"
            : `Hear pronunciation of ${copticText}`
        }
        aria-pressed={isSpeaking}
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
          isSpeaking
            ? "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
            : "text-stone-400 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200",
          className,
        )}
      >
        {isSpeaking ? (
          // Stop icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Speaker icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
      <FloatingTooltip
        anchorRef={buttonRef}
        isOpen={isHovered && !isSpeaking}
        className="max-w-[200px] text-center text-xs text-stone-100 bg-stone-900 px-3 py-2 rounded-lg shadow-lg dark:bg-stone-800 dark:text-stone-300 border border-stone-800 dark:border-stone-700 font-medium"
        withArrow
        arrowClassName="bg-stone-900 dark:bg-stone-800 border-b border-r border-stone-800 dark:border-stone-700"
      >
        {t("dict.ttsDisclaimer")}
      </FloatingTooltip>
    </>
  );
}
