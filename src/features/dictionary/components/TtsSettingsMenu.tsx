"use client";

import { Volume2, ChevronDown, Check } from "lucide-react";
import { useState, useRef } from "react";

import { buttonClassName } from "@/components/Button";
import {
  type TtsMode,
  useTtsSettings,
} from "@/features/dictionary/hooks/useTtsSettings";
import { type VoiceKey, VOICES } from "@/features/dictionary/lib/copticTts";
import { cx } from "@/lib/classes";

export function TtsSettingsMenu() {
  const { settings, updateSettings, isLoaded } = useTtsSettings();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!isLoaded) {
    return null;
  }

  const handleModeChange = (mode: TtsMode) => {
    updateSettings({ mode });
  };

  const handleVoiceChange = (voice: VoiceKey) => {
    updateSettings({ voice });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName({ variant: "secondary" })}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Volume2 className="h-4 w-4" />
        <span className="hidden sm:inline">
          {settings.mode === "premium"
            ? VOICES[settings.voice].label
            : "Standard TTS"}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-stone-200 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-stone-800 dark:bg-stone-900"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="tts-settings-menu"
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              TTS Mode
            </div>

            <button
              onClick={() => handleModeChange("standard")}
              className={cx(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                settings.mode === "standard"
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                  : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800",
              )}
              role="menuitem"
            >
              <span>Standard (Browser)</span>
              {settings.mode === "standard" && <Check className="h-4 w-4" />}
            </button>

            <button
              onClick={() => handleModeChange("premium")}
              className={cx(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                settings.mode === "premium"
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                  : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800",
              )}
              role="menuitem"
            >
              <span>Premium (AI)</span>
              {settings.mode === "premium" && <Check className="h-4 w-4" />}
            </button>

            {settings.mode === "premium" && (
              <>
                <div className="my-1 h-px bg-stone-200 dark:bg-stone-800" />
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Premium Voice
                </div>
                {Object.entries(VOICES).map(([key, voice]) => (
                  <button
                    key={key}
                    onClick={() => handleVoiceChange(key as VoiceKey)}
                    className={cx(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                      settings.voice === key
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                        : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800",
                    )}
                    role="menuitem"
                  >
                    <span>{voice.label}</span>
                    {settings.voice === key && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
