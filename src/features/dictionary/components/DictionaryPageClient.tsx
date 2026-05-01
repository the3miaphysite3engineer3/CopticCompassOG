"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { useDictionarySearch } from "@/features/dictionary/hooks/useDictionarySearch";
import { getAnalyticsPath, getLocalizedHomePath } from "@/lib/locale";

import { DictionaryFilters } from "./DictionaryFilters";
import { DictionaryResultsSection } from "./DictionaryResultsSection";
import { DictionarySearchBar } from "./DictionarySearchBar";
import { TtsSettingsMenu } from "./TtsSettingsMenu";

type DictionaryPageBodyProps = {
  searchPath: string;
};

function DictionaryPageBody({ searchPath }: DictionaryPageBodyProps) {
  const { language, t } = useLanguage();
  const {
    dictionaryLength,
    exactMatch,
    filteredResults,
    handleKeyboardAppend,
    handleKeyboardBackspace,
    handleSelectionChange,
    hasMoreResults,
    isKeyboardOpen,
    loadMoreResults,
    loading,
    loadingMore,
    query,
    resultsKey,
    searchInputRef,
    selectedDialect,
    selectedPartOfSpeech,
    setKeyboardOpen,
    setQuery,
    setSelectedDialect,
    setSelectedPartOfSpeech,
    setExactMatch,
    visibleQuery,
    totalMatches,
  } = useDictionarySearch({ searchPath });

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-content"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      <div className="mb-8 space-y-4 md:mb-10">
        <BreadcrumbTrail
          items={[
            { label: t("nav.home"), href: getLocalizedHomePath(language) },
            { label: t("nav.dictionary") },
          ]}
        />

        <div className="flex items-center justify-end gap-3">
          <TtsSettingsMenu />
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
        size="workspace"
        tone="brand"
        className="mb-8 md:mb-12"
      />

      <div className="app-sticky-panel relative isolate mb-8 flex flex-col gap-3 md:mb-12 md:gap-4">
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
          exactMatch={exactMatch}
          onClearFilters={() => {
            setSelectedDialect("ALL");
            setSelectedPartOfSpeech("ALL");
            setExactMatch(false);
          }}
          selectedDialect={selectedDialect}
          selectedPartOfSpeech={selectedPartOfSpeech}
          setExactMatch={setExactMatch}
          setSelectedDialect={setSelectedDialect}
          setSelectedPartOfSpeech={setSelectedPartOfSpeech}
        />
      </div>

      <DictionaryResultsSection
        key={resultsKey}
        dictionaryLength={dictionaryLength}
        filteredResults={filteredResults}
        hasMoreResults={hasMoreResults}
        loading={loading}
        loadingMore={loadingMore}
        onLoadMore={loadMoreResults}
        query={visibleQuery}
        selectedDialect={selectedDialect}
        selectedPartOfSpeech={selectedPartOfSpeech}
        totalMatches={totalMatches}
      />
    </PageShell>
  );
}

export default function DictionaryPageClient() {
  const searchPath = "/api/v1/dictionary/search";

  return <DictionaryPageBody key={searchPath} searchPath={searchPath} />;
}
