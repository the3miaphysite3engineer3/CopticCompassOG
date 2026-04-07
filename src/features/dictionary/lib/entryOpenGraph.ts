import { siteConfig } from "@/lib/site";
import type { Language } from "@/types/i18n";
import type { LexicalEntry } from "../types";
import { getPreferredEntryDisplaySpelling } from "./entryDisplay";
import { getEntrySummary, toPlainText } from "./entryText";
import { buildOpenGraphImageUrl } from "@/features/seo/lib/openGraph";

type BuildEntryOpenGraphPreviewOptions = {
  entry: LexicalEntry;
  language: Language;
  parentEntry?: LexicalEntry | null;
  relatedEntries?: readonly LexicalEntry[];
};

export type EntryOpenGraphPreview = {
  gloss: string;
  heading: string;
  relatedForms: string[];
  strapline: string;
};

function getDisplayForm(entry: LexicalEntry) {
  return toPlainText(getPreferredEntryDisplaySpelling(entry));
}

function collectRelatedForms(
  entry: LexicalEntry,
  parentEntry: LexicalEntry | null | undefined,
  relatedEntries: readonly LexicalEntry[],
) {
  const forms: string[] = [];
  const seenIds = new Set([entry.id]);
  const seenForms = new Set([getDisplayForm(entry)]);

  for (const candidate of [parentEntry, ...relatedEntries]) {
    if (!candidate || seenIds.has(candidate.id)) {
      continue;
    }

    seenIds.add(candidate.id);

    const form = getDisplayForm(candidate);
    if (!form || seenForms.has(form)) {
      continue;
    }

    seenForms.add(form);
    forms.push(form);

    if (forms.length === 2) {
      break;
    }
  }

  return forms;
}

export function buildEntryOpenGraphImageUrl(
  entryId: string,
  language: Language,
  baseUrl = siteConfig.liveUrl,
) {
  return buildOpenGraphImageUrl({
    baseUrl,
    id: entryId,
    locale: language,
    type: "entry",
  });
}

export function buildEntryOpenGraphPreview({
  entry,
  language,
  parentEntry = null,
  relatedEntries = [],
}: BuildEntryOpenGraphPreviewOptions): EntryOpenGraphPreview {
  return {
    gloss:
      getEntrySummary(entry, language) ||
      (language === "nl"
        ? "Koptisch woordenboeklemma"
        : "Coptic dictionary entry"),
    heading: getDisplayForm(entry),
    relatedForms: collectRelatedForms(entry, parentEntry, relatedEntries),
    strapline: language === "nl" ? "Koptisch woordenboek" : "Coptic Dictionary",
  };
}
