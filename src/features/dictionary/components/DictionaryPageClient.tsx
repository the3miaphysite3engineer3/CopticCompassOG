"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { buttonClassName } from "@/components/Button";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { getAnalyticsPath, getLocalizedHomePath } from "@/lib/locale";
import { DictionaryFilters } from "./DictionaryFilters";
import { DictionaryResultsSection } from "./DictionaryResultsSection";
import { DictionarySearchBar } from "./DictionarySearchBar";
import { useDictionarySearch } from "@/features/dictionary/hooks/useDictionarySearch";

type DictionaryPageBodyProps = {
  dictionaryPath: string;
};

function DictionaryPageBody({ dictionaryPath }: DictionaryPageBodyProps) {
  const { language, t } = useLanguage();
  const {
    dictionaryLength,
    filteredResults,
    handleKeyboardAppend,
    handleKeyboardBackspace,
    handleSelectionChange,
    isKeyboardOpen,
    loading,
    query,
    resultsKey,
    searchInputRef,
    selectedDialect,
    selectedPartOfSpeech,
    setKeyboardOpen,
    setQuery,
    setSelectedDialect,
    setSelectedPartOfSpeech,
    exactMatch,
    setExactMatch,
    visibleQuery,
  } = useDictionarySearch({ dictionaryPath });

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 pb-20 md:p-10"
      contentClassName="w-full pt-10"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      <div className="mb-5 space-y-4">
        <BreadcrumbTrail
          items={[
            { label: t("nav.home"), href: getLocalizedHomePath(language) },
            { label: t("nav.dictionary") },
          ]}
        />

        <div className="flex items-center justify-end">
          <Link
            href={getAnalyticsPath(language)}
            className={buttonClassName({ variant: "secondary" })}
          >
            <BarChart3 className="h-4 w-4" />
            {t("nav.analytics")}
          </Link>
        </div>
      </div>

      <PageHeader
        title={t("dict.title")}
        description={t("dict.subtitle")}
        size="hero"
        tone="brand"
        className="mb-16"
      />

      <div className="relative app-sticky-panel isolate mb-12 flex flex-col gap-4">
        <DictionarySearchBar
          isKeyboardOpen={isKeyboardOpen}
          onAppend={handleKeyboardAppend}
          onBackspace={handleKeyboardBackspace}
          onCloseKeyboard={() => setKeyboardOpen(false)}
          onQueryChange={setQuery}
          onSelectionChange={handleSelectionChange}
          onToggleKeyboard={() => setKeyboardOpen(!isKeyboardOpen)}
          query={query}
          searchInputRef={searchInputRef}
        />

        <DictionaryFilters
          selectedDialect={selectedDialect}
          selectedPartOfSpeech={selectedPartOfSpeech}
          setSelectedDialect={setSelectedDialect}
          setSelectedPartOfSpeech={setSelectedPartOfSpeech}
          exactMatch={exactMatch}
          setExactMatch={setExactMatch}
        />
      </div>

      <DictionaryResultsSection
        key={resultsKey}
        dictionaryLength={dictionaryLength}
        filteredResults={filteredResults}
        loading={loading}
        query={visibleQuery}
        selectedDialect={selectedDialect}
        selectedPartOfSpeech={selectedPartOfSpeech}
      />
    </PageShell>
  );
}

export default function DictionaryPageClient() {
  const dictionaryPath = "/data/dictionary.json";

  return (
    <DictionaryPageBody key={dictionaryPath} dictionaryPath={dictionaryPath} />
  );
}
