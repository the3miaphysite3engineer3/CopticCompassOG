"use client";

import { useEffect, useRef } from "react";

import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getPartOfSpeechFilterLabel,
  type DialectFilter,
  type DictionaryPartOfSpeechFilter,
} from "@/features/dictionary/config";
import type { DictionaryClientEntry } from "@/features/dictionary/types";

import DialectSiglum from "./DialectSiglum";
import DictionaryEntryCard from "./DictionaryEntry";

type DictionaryResultsSectionProps = {
  dictionaryLength: number;
  filteredResults: DictionaryClientEntry[];
  hasMoreResults?: boolean;
  loading: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  query: string;
  selectedDialect: DialectFilter;
  selectedPartOfSpeech: DictionaryPartOfSpeechFilter;
  scrollContainerId?: string;
  totalMatches: number;
};

export function DictionaryResultsSection({
  dictionaryLength,
  filteredResults,
  hasMoreResults = false,
  loading,
  loadingMore = false,
  onLoadMore,
  query,
  selectedDialect,
  selectedPartOfSpeech,
  scrollContainerId,
  totalMatches,
}: DictionaryResultsSectionProps) {
  const { t } = useLanguage();
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRequestedRef = useRef(false);

  useEffect(() => {
    if (!loadingMore) {
      loadMoreRequestedRef.current = false;
    }
  }, [filteredResults.length, hasMoreResults, loadingMore]);

  useEffect(() => {
    if (!hasMoreResults || !onLoadMore) {
      return;
    }

    const target = observerTarget.current;
    if (!target) {
      return;
    }

    const rootTarget = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !entries[0]?.isIntersecting ||
          loadingMore ||
          loadMoreRequestedRef.current
        ) {
          return;
        }

        loadMoreRequestedRef.current = true;
        onLoadMore();
      },
      { threshold: 0.1, root: rootTarget },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    filteredResults.length,
    hasMoreResults,
    loadingMore,
    onLoadMore,
    scrollContainerId,
  ]);

  return (
    <>
      {!loading && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Badge tone="surface" size="md" className="font-medium">
            {query.trim().length === 0 &&
            selectedPartOfSpeech === "ALL" &&
            selectedDialect === "ALL"
              ? `${t("dict.showing")} ${filteredResults.length} ${t("dict.outOf")} ${dictionaryLength} ${t("dict.entries")}`
              : `${t("dict.found")} ${totalMatches} ${t("dict.results")}`}
          </Badge>

          {(selectedPartOfSpeech !== "ALL" || selectedDialect !== "ALL") && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {selectedPartOfSpeech !== "ALL" && (
                <Badge tone="neutral" size="xs">
                  {t("dict.pos")}{" "}
                  {getPartOfSpeechFilterLabel(selectedPartOfSpeech, t)}
                </Badge>
              )}
              {selectedDialect !== "ALL" && (
                <Badge tone="accent" size="sm" className="min-h-8">
                  {t("dict.dialect")}{" "}
                  <span className="ml-1">
                    <DialectSiglum siglum={selectedDialect} />
                  </span>
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-700 border-t-sky-500"></div>
        </div>
      )}

      {!loading && filteredResults.length === 0 && (
        <EmptyState
          title={t("dict.noMatch")}
          description={t("dict.tryFuzzy")}
          className="dark:border-stone-800/60 dark:bg-stone-900/40 dark:shadow-lg"
          titleClassName="font-medium text-stone-700 dark:text-stone-300"
          descriptionClassName="mt-2 text-stone-500 dark:text-stone-500"
        />
      )}

      <div className="grid gap-6">
        {filteredResults.map((entry) => (
          <DictionaryEntryCard
            key={entry.id}
            entry={entry}
            query={query}
            selectedDialect={selectedDialect}
          />
        ))}
      </div>

      {hasMoreResults && (
        <div
          ref={observerTarget}
          className="mt-10 flex h-20 w-full items-center justify-center"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-700 border-t-sky-500"></div>
        </div>
      )}
    </>
  );
}
