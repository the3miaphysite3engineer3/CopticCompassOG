"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "nl" : "en")}
      className="inline-flex h-10 min-w-[3rem] items-center justify-center rounded-xl border border-line bg-surface px-3 text-xs font-medium tracking-[0.08em] text-muted shadow-soft transition-colors hover:bg-elevated hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      aria-label="Toggle Language"
      title={`Switch to ${language === "en" ? "Dutch" : "English"}`}
    >
      {language.toUpperCase()}
    </button>
  );
}
