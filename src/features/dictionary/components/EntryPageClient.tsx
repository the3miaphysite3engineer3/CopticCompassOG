"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { RelatedGrammarLessonsPanel } from "@/features/grammar/components/RelatedGrammarLessonsPanel";
import type { GrammarLessonReference } from "@/features/grammar/lib/grammarContentGraph";
import type { LexicalEntry } from "@/features/dictionary/types";
import DictionaryEntryCard from "./DictionaryEntry";
import EntryRelationsPanel from "./EntryRelationsPanel";

type EntryPageClientProps = {
  entryId: string;
  initialEntry: LexicalEntry;
  initialParentEntry: LexicalEntry | null;
  initialRelatedEntries: readonly LexicalEntry[];
  relatedGrammarLessons: readonly GrammarLessonReference[];
};

function resolveEntryRelations(
  entry: LexicalEntry,
  dictionary: readonly LexicalEntry[],
) {
  const parentEntry = entry.parentEntryId
    ? dictionary.find((candidate) => candidate.id === entry.parentEntryId) ?? null
    : null;
  const relatedEntries = entry.parentEntryId
    ? dictionary.filter(
        (candidate) =>
          candidate.parentEntryId === entry.parentEntryId &&
          candidate.id !== entry.id,
      )
    : dictionary.filter((candidate) => candidate.parentEntryId === entry.id);

  return {
    parentEntry,
    relatedEntries: [...relatedEntries].sort((left, right) =>
      left.headword.localeCompare(right.headword),
    ),
  };
}

export default function EntryPageClient({
  entryId,
  initialEntry,
  initialParentEntry,
  initialRelatedEntries,
  relatedGrammarLessons,
}: EntryPageClientProps) {
  const { language } = useLanguage();
  const [entry, setEntry] = useState(initialEntry);
  const [parentEntry, setParentEntry] = useState(initialParentEntry);
  const [relatedEntries, setRelatedEntries] = useState<readonly LexicalEntry[]>(
    initialRelatedEntries,
  );

  useEffect(() => {
    let cancelled = false;
    const dictionaryPath =
      language === "nl" ? "/data/woordenboek.json" : "/data/dictionary.json";

    async function loadLocalizedEntry() {
      try {
        const response = await fetch(dictionaryPath);

        if (!response.ok) {
          throw new Error(`Failed to load ${dictionaryPath}`);
        }

        const dictionary = (await response.json()) as LexicalEntry[];
        const localizedEntry =
          dictionary.find((candidate) => candidate.id === entryId) ?? initialEntry;

        if (cancelled) {
          return;
        }

        const relations = resolveEntryRelations(localizedEntry, dictionary);

        setEntry(localizedEntry);
        setParentEntry(relations.parentEntry);
        setRelatedEntries(relations.relatedEntries);
      } catch {
        if (cancelled) {
          return;
        }

        setEntry(initialEntry);
        setParentEntry(initialParentEntry);
        setRelatedEntries(initialRelatedEntries);
      }
    }

    void loadLocalizedEntry();

    return () => {
      cancelled = true;
    };
  }, [entryId, initialEntry, initialParentEntry, initialRelatedEntries, language]);

  return (
    <>
      <DictionaryEntryCard entry={entry} headingLevel="h1" linkHeadword={false} />
      <EntryRelationsPanel
        entry={entry}
        parentEntry={parentEntry}
        relatedEntries={relatedEntries}
      />
      <RelatedGrammarLessonsPanel
        description={
          language === "nl"
            ? "Bekijk grammaticaonderdelen waarin dit lemma expliciet voorkomt of wordt toegelicht."
            : "Explore grammar lessons where this entry appears explicitly or is discussed in context."
        }
        language={language}
        lessons={relatedGrammarLessons}
        title={
          language === "nl"
            ? "Gebruikt in grammaticahandleidingen"
            : "Used in grammar lessons"
        }
      />
    </>
  );
}
