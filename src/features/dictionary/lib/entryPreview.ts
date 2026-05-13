import type { Language } from "@/types/i18n";

import {
  formatGenderedHeadingParts,
  getGenderedHeadingParts,
  getPreferredEntryDisplaySpelling,
  type GenderedHeadingMarker,
} from "./entryDisplay";
import {
  getEntrySummary,
  getLocalizedGenderedMeanings,
  toPlainText,
} from "./entryText";

import type { LexicalEntry } from "../types";

type EntryPreviewOptions = {
  entry: LexicalEntry;
  language: Language;
};

export type EntryPreviewGenderedGlossRow = {
  values: Array<{
    marker: GenderedHeadingMarker;
    meaning: string;
  }>;
};

export type EntryPreviewHeadingPart = {
  marker: GenderedHeadingMarker;
  spelling: string;
};

type EntryPreview = {
  genderedGlossRows: EntryPreviewGenderedGlossRow[];
  gloss: string;
  heading: string;
  headingParts: EntryPreviewHeadingPart[];
};

function getDisplayForm(entry: LexicalEntry) {
  return toPlainText(getPreferredEntryDisplaySpelling(entry));
}

function buildPreviewHeading(entry: LexicalEntry) {
  const genderedHeadingParts = getGenderedHeadingParts(entry);

  if (genderedHeadingParts.length > 0) {
    return {
      heading: formatGenderedHeadingParts(genderedHeadingParts),
      headingParts: genderedHeadingParts.map(({ marker, spelling }) => ({
        marker,
        spelling,
      })),
    };
  }

  const heading = getDisplayForm(entry);

  return {
    heading,
    headingParts: [],
  };
}

function getGenderedGlossRows(
  entry: LexicalEntry,
  language: Language,
): EntryPreviewGenderedGlossRow[] {
  return getLocalizedGenderedMeanings(entry, language).map((row) => ({
    values: row.values,
  }));
}

function formatGenderedGlossRows(
  rows: readonly EntryPreviewGenderedGlossRow[],
) {
  return rows
    .map((row) =>
      row.values
        .map(({ marker, meaning }) => `${marker} ${meaning}`)
        .join("; "),
    )
    .filter(Boolean)
    .join("; ");
}

function buildPreviewGloss(
  entry: LexicalEntry,
  language: Language,
  genderedGlossRows: readonly EntryPreviewGenderedGlossRow[],
) {
  return (
    formatGenderedGlossRows(genderedGlossRows) ||
    getEntrySummary(entry, language)
  );
}

/**
 * Builds the plain-text dictionary-entry preview shared by page metadata,
 * generated Open Graph images, and user-facing share text.
 */
export function buildEntryPreview({
  entry,
  language,
}: EntryPreviewOptions): EntryPreview {
  const { heading, headingParts } = buildPreviewHeading(entry);
  const genderedGlossRows = getGenderedGlossRows(entry, language);

  return {
    genderedGlossRows,
    gloss: buildPreviewGloss(entry, language, genderedGlossRows),
    heading,
    headingParts,
  };
}
