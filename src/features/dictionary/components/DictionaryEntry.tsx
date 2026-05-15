"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  getPartOfSpeechCode,
  getPartOfSpeechLabel,
  type DialectFilter,
  type DictionaryDialectCode,
} from "@/features/dictionary/config";
import { getGrammarAbbreviationTooltips } from "@/features/dictionary/grammarRegistry";
import {
  formatDialectForms,
  formatImperativeForms,
  getPreferredEntryPrincipalSpelling,
  getAllPluralForms,
  getDialectImperativeForms,
  getDialectPluralForms,
  getDialectVariantRows,
  getGenderedDialectFormParts,
  getGenderedHeadingParts,
  getPreferredEntryDialectKey,
  type GenderedHeadingMarker,
} from "@/features/dictionary/lib/entryDisplay";
import {
  getEntryNounGender,
  getPrimaryEntryPartOfSpeech,
} from "@/features/dictionary/lib/entryGrammar";
import {
  getLocalizedDisplayDialectMeanings,
  getLocalizedGenderedMeanings,
  getLocalizedSenseGroups,
} from "@/features/dictionary/lib/entryText";
import type {
  DictionaryClientEntry,
  LexicalGender,
} from "@/features/dictionary/types";
import { cx } from "@/lib/classes";
import { antinoou } from "@/lib/fonts";
import { getEntryPath } from "@/lib/locale";

import DialectSiglum from "./DialectSiglum";
import HighlightText from "./HighlightText";
import { LinguisticGloss, LinguisticGlossGroup } from "./LinguisticGloss";
import { SpeakButton } from "./SpeakButton";

import type { FormSymbolTooltips } from "./HighlightText";

type DictionaryEntryCardProps = {
  entry: DictionaryClientEntry;
  query?: string;
  selectedDialect?: DialectFilter;
  headingLevel?: "h1" | "h2";
  linkHeadword?: boolean;
  actions?: ReactNode;
};

type DialectEntryTuple = [
  DictionaryDialectCode,
  NonNullable<DictionaryClientEntry["dialects"][DictionaryDialectCode]>,
];
type EntryDialectSelection = "ALL" | DictionaryDialectCode;

function getFormSymbolTooltips(
  t: ReturnType<typeof useLanguage>["t"],
): FormSymbolTooltips {
  return {
    "-": t("entry.symbol.nominal"),
    "=": t("entry.symbol.pronominal"),
    "†": t("entry.symbol.stative"),
    "~": t("entry.symbol.constructParticiple"),
  };
}

function getMainGenderMarkers(
  gender: LexicalGender | undefined,
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (!gender) {
    return [];
  }

  const markers =
    gender === "BOTH"
      ? [
          { code: "m", label: t("entry.gender.masculine") },
          { code: "f", label: t("entry.gender.feminine") },
        ]
      : [
          gender === "M"
            ? { code: "m", label: t("entry.gender.masculine") }
            : { code: "f", label: t("entry.gender.feminine") },
        ];

  return markers;
}

function getGenderedHeadingMarkerLabel(
  marker: GenderedHeadingMarker,
  t: ReturnType<typeof useLanguage>["t"],
) {
  switch (marker) {
    case "m":
      return t("entry.gender.masculine");
    case "f":
      return t("entry.gender.feminine");
    case "pl":
      return t("entry.abbreviation.pl");
  }
}

export default function DictionaryEntryCard({
  actions,
  entry,
  query = "",
  selectedDialect = DEFAULT_DICTIONARY_DIALECT_FILTER,
  headingLevel = "h2",
  linkHeadword = true,
}: DictionaryEntryCardProps) {
  const { language, t } = useLanguage();
  const articleRef = useRef<HTMLElement>(null);
  const [viewDialect, setViewDialect] =
    useState<EntryDialectSelection>(selectedDialect);
  const [prevSelectedDialect, setPrevSelectedDialect] =
    useState<DialectFilter>(selectedDialect);

  if (selectedDialect !== prevSelectedDialect) {
    setPrevSelectedDialect(selectedDialect);
    setViewDialect(selectedDialect);
  }

  const isDetailView = headingLevel === "h1";
  const primaryDialectKey = getPreferredEntryDialectKey(entry, viewDialect);

  let headerSpelling = entry.headword;
  const primaryForms = primaryDialectKey
    ? entry.dialects[primaryDialectKey]
    : undefined;

  if (primaryForms) {
    /**
     * Collapse the selected dialect's forms into the compact heading notation
     * used throughout the dictionary UI.
     */
    headerSpelling = formatDialectForms(primaryForms, entry.headword);
  }

  const canSpeakPrimarySpelling = primaryDialectKey === "B";
  const remainingDialects = Object.entries(entry.dialects).filter(
    (dialectEntry): dialectEntry is DialectEntryTuple =>
      dialectEntry[0] !== primaryDialectKey && Boolean(dialectEntry[1]),
  );
  const HeadingTag = headingLevel;
  const headingClassName = `${antinoou.className} ${
    isDetailView ? "text-5xl md:text-6xl" : "text-4xl"
  } text-coptic tracking-wide transition-colors ${
    linkHeadword ? "hover:text-accent-strong cursor-pointer" : ""
  }`;
  const formSymbolTooltips = getFormSymbolTooltips(t);
  const grammarAbbreviationTooltips = getGrammarAbbreviationTooltips(t);
  const mainGenderMarkers = getMainGenderMarkers(getEntryNounGender(entry), t);
  const genderedHeadingParts = getGenderedHeadingParts(entry, viewDialect);
  const hasGenderedHeading = genderedHeadingParts.length > 0;
  const primaryDialectPlurals = primaryDialectKey
    ? getDialectPluralForms(entry, primaryDialectKey, {
        includeUnscoped: true,
      })
    : getAllPluralForms(entry);
  const visiblePrimaryDialectPlurals = primaryDialectPlurals.filter(
    (pluralForm) => pluralForm.trim() !== headerSpelling.trim(),
  );
  const headingPluralForm = visiblePrimaryDialectPlurals[0] ?? "";

  const primaryPartOfSpeech = getPrimaryEntryPartOfSpeech(entry);
  const partOfSpeechLabel = getPartOfSpeechLabel(primaryPartOfSpeech, t);
  const partOfSpeechCode = getPartOfSpeechCode(primaryPartOfSpeech);
  const showInlinePos = partOfSpeechCode !== "" && partOfSpeechCode !== "n";
  const focusableHeadingGlosses = !linkHeadword;

  const headingContent = (
    <HeadingTag
      className={`${headingClassName} flex flex-wrap items-baseline gap-x-3 gap-y-1`}
    >
      {hasGenderedHeading ? (
        genderedHeadingParts.map((part) => (
          <span
            key={`${part.entryId ?? entry.id}-${part.marker}-${part.spelling}`}
            className="inline-flex min-w-0 items-baseline gap-x-2"
          >
            <span>
              <HighlightText
                text={part.spelling}
                query={query}
                symbolTooltips={formSymbolTooltips}
              />
            </span>
            <LinguisticGloss
              code={part.marker}
              label={getGenderedHeadingMarkerLabel(part.marker, t)}
              size="heading"
              focusable={focusableHeadingGlosses}
            />
          </span>
        ))
      ) : (
        <span className="min-w-0">
          <HighlightText
            text={headerSpelling}
            query={query}
            symbolTooltips={formSymbolTooltips}
          />
          {showInlinePos && (
            <>
              {" "}
              <LinguisticGloss
                code={partOfSpeechCode}
                label={partOfSpeechLabel}
                size="heading"
                focusable={focusableHeadingGlosses}
              />
            </>
          )}
        </span>
      )}
      {hasGenderedHeading && showInlinePos && (
        <LinguisticGloss
          code={partOfSpeechCode}
          label={partOfSpeechLabel}
          size="heading"
          focusable={focusableHeadingGlosses}
        />
      )}
      {!hasGenderedHeading && mainGenderMarkers.length > 0 && (
        <LinguisticGlossGroup
          markers={mainGenderMarkers}
          size="heading"
          focusable={focusableHeadingGlosses}
        />
      )}
      {!hasGenderedHeading && primaryDialectPlurals.length > 0 && (
        <>
          {headingPluralForm && (
            <span>
              <HighlightText
                text={headingPluralForm}
                query={query}
                symbolTooltips={formSymbolTooltips}
              />
            </span>
          )}
          <LinguisticGloss
            code="pl"
            label={t("entry.abbreviation.pl")}
            size="heading"
            focusable={focusableHeadingGlosses}
          />
        </>
      )}
    </HeadingTag>
  );
  const imperativeForms = primaryDialectKey
    ? getDialectImperativeForms(entry, primaryDialectKey)
    : [];
  const localizedSenses = getLocalizedSenseGroups(entry, language, {
    dialectForms: primaryForms,
    hasImperativeForms: imperativeForms.length > 0,
  });
  const hasGroupedGenderedMeanings = localizedSenses.some(
    (group) => (group.genderedRows?.length ?? 0) > 0,
  );
  const genderedMeanings = hasGroupedGenderedMeanings
    ? []
    : getLocalizedGenderedMeanings(entry, language);
  const dialectMeanings = getLocalizedDisplayDialectMeanings(entry, language);
  const variantRows = [
    ...(primaryDialectKey && primaryForms
      ? getDialectVariantRows(primaryForms).map((row) => ({
          dialect: primaryDialectKey,
          ...row,
        }))
      : []),
  ];
  const compactBadgeClassName = "h-8 min-h-8 min-w-8 justify-center px-3";
  let compoundRootLabel = "";

  if (entry.rootEntry) {
    compoundRootLabel = getPreferredEntryPrincipalSpelling(
      entry.rootEntry,
      viewDialect,
    );
  } else if (entry.root_id !== undefined) {
    compoundRootLabel = String(entry.root_id);
  }

  const handleDialectViewChange = (dialect: DictionaryDialectCode) => {
    setViewDialect(dialect);

    if (isDetailView) {
      articleRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  const metadataBadges = (
    <>
      {entry.root_id !== undefined && (
        <Link
          href={getEntryPath(entry.root_id, language)}
          prefetch={false}
          className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-lg border border-accent/25 bg-accent-soft/80 px-3 text-xs font-semibold text-accent-strong transition hover:border-accent/45 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-accent"
        >
          <span>{t("entry.compoundOf")}</span>
          <span
            className={`${antinoou.className} min-w-0 truncate text-sm font-normal tracking-wide`}
          >
            <HighlightText
              text={compoundRootLabel}
              query={query}
              symbolTooltips={formSymbolTooltips}
            />
          </span>
        </Link>
      )}
      {primaryDialectKey && (
        <Badge tone="neutral" size="sm" className={compactBadgeClassName}>
          <DialectSiglum siglum={primaryDialectKey} />
        </Badge>
      )}
    </>
  );

  return (
    <article
      ref={articleRef}
      className={surfacePanelClassName({
        rounded: "lg",
        interactive: linkHeadword,
        className: cx(
          "group relative overflow-hidden",
          linkHeadword && "hover:border-accent/40 hover:bg-surface",
          isDetailView ? "p-8 md:p-10" : "p-6 md:p-7",
        ),
      })}
    >
      {isDetailView ? (
        <div className="relative mb-5 flex min-w-0 flex-col gap-4">
          <div className="min-w-0">
            {linkHeadword ? (
              <Link
                href={getEntryPath(entry.id, language)}
                prefetch={false}
                className="inline-block max-w-full break-words [overflow-wrap:anywhere]"
              >
                {headingContent}
              </Link>
            ) : (
              headingContent
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {canSpeakPrimarySpelling && (
                <SpeakButton
                  copticText={headerSpelling}
                  className="h-8 w-8 border border-line bg-elevated text-muted hover:border-accent/40"
                />
              )}
              {metadataBadges}
            </div>
            {actions ? (
              <div className="flex w-full min-w-0 flex-col items-start gap-3 sm:w-auto sm:items-end">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="relative mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-start gap-3">
            <div className="min-w-0">
              {linkHeadword ? (
                <Link
                  href={getEntryPath(entry.id, language)}
                  prefetch={false}
                  className="inline-block max-w-full break-words [overflow-wrap:anywhere]"
                >
                  {headingContent}
                </Link>
              ) : (
                headingContent
              )}
            </div>
            {canSpeakPrimarySpelling && (
              <SpeakButton
                copticText={headerSpelling}
                className="mt-1 shrink-0 sm:mt-1.5"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {metadataBadges}
          </div>
        </div>
      )}

      <div className="mb-6 h-px w-full bg-line" />

      <div className="mb-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
          {t("entry.translation")}
        </h3>
        {genderedMeanings.length > 0 && (
          <ul
            className={`ml-5 list-disc space-y-2 text-ink marker:text-coptic ${
              isDetailView ? "text-lg md:text-xl" : "text-lg"
            }`}
          >
            {genderedMeanings.map((row, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {row.values.map(({ marker, meaning }, valueIndex) => (
                    <span
                      key={`${marker}-${valueIndex}`}
                      className="inline-flex items-baseline gap-x-1.5"
                    >
                      <LinguisticGloss
                        code={marker}
                        label={getGenderedHeadingMarkerLabel(marker, t)}
                        size="inline"
                      />
                      <span>
                        <HighlightText
                          text={meaning}
                          query={query}
                          grammarAbbreviationTooltips={
                            grammarAbbreviationTooltips
                          }
                        />
                        {valueIndex < row.values.length - 1 && (
                          <span className="text-muted/70">;</span>
                        )}
                      </span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
        {localizedSenses.length > 0 && (
          <div className="grid gap-3">
            {localizedSenses.map((group, groupIndex) => {
              const groupGenderedRows = group.genderedRows ?? [];
              const hasMeaningRows =
                groupGenderedRows.length > 0 || group.meanings.length > 0;

              return (
                <div
                  key={`${group.code}-${groupIndex}`}
                  className="grid gap-2 border-l-2 border-coptic/25 pl-3"
                >
                  <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                    <LinguisticGloss
                      code={group.code}
                      label={
                        grammarAbbreviationTooltips[
                          group.code.toLocaleLowerCase()
                        ] ?? group.code
                      }
                      size="body"
                    />
                    {group.notes.map((note, idx) => (
                      <span
                        key={`${group.code}-note-${idx}`}
                        className="text-sm text-muted"
                      >
                        <HighlightText
                          text={note}
                          query={query}
                          grammarAbbreviationTooltips={
                            grammarAbbreviationTooltips
                          }
                        />
                      </span>
                    ))}
                  </div>
                  {hasMeaningRows && (
                    <ul
                      className={`ml-5 list-disc space-y-1.5 text-ink marker:text-coptic ${
                        isDetailView ? "text-lg md:text-xl" : "text-lg"
                      }`}
                    >
                      {groupGenderedRows.map((row, idx) => (
                        <li
                          key={`${group.code}-gendered-${idx}`}
                          className="leading-relaxed pl-1"
                        >
                          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            {row.values.map(
                              ({ marker, meaning }, valueIndex) => (
                                <span
                                  key={`${marker}-${valueIndex}`}
                                  className="inline-flex items-baseline gap-x-1.5"
                                >
                                  <LinguisticGloss
                                    code={marker}
                                    label={getGenderedHeadingMarkerLabel(
                                      marker,
                                      t,
                                    )}
                                    size="inline"
                                  />
                                  <span>
                                    <HighlightText
                                      text={meaning}
                                      query={query}
                                      grammarAbbreviationTooltips={
                                        grammarAbbreviationTooltips
                                      }
                                    />
                                    {valueIndex < row.values.length - 1 && (
                                      <span className="text-muted/70">;</span>
                                    )}
                                  </span>
                                </span>
                              ),
                            )}
                          </span>
                        </li>
                      ))}
                      {group.meanings.map((meaning, idx) => (
                        <li
                          key={`${group.code}-meaning-${idx}`}
                          className="leading-relaxed pl-1"
                        >
                          <HighlightText
                            text={meaning}
                            query={query}
                            grammarAbbreviationTooltips={
                              grammarAbbreviationTooltips
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {dialectMeanings.length > 0 && (
          <div className="grid gap-3">
            {dialectMeanings.map((dialectMeaning) => (
              <div
                key={dialectMeaning.sourceLabel}
                className="grid gap-2 border-l-2 border-coptic/25 pl-3"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                  {dialectMeaning.dialects.map((dialect) => (
                    <span
                      key={`${dialectMeaning.sourceLabel}-${dialect}`}
                      className="inline-flex min-h-6 items-center rounded-md bg-elevated px-2 text-[10px] font-bold text-muted"
                    >
                      <DialectSiglum siglum={dialect} />
                    </span>
                  ))}
                  {dialectMeaning.notes.map((note, idx) => (
                    <span
                      key={`${dialectMeaning.sourceLabel}-note-${idx}`}
                      className="text-sm text-muted"
                    >
                      <HighlightText
                        text={note}
                        query={query}
                        grammarAbbreviationTooltips={
                          grammarAbbreviationTooltips
                        }
                      />
                    </span>
                  ))}
                </div>
                {dialectMeaning.meanings.length > 0 && (
                  <ul
                    className={`ml-5 list-disc space-y-1.5 text-ink marker:text-coptic ${
                      isDetailView ? "text-lg md:text-xl" : "text-lg"
                    }`}
                  >
                    {dialectMeaning.meanings.map((meaning, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        <HighlightText
                          text={meaning}
                          query={query}
                          grammarAbbreviationTooltips={
                            grammarAbbreviationTooltips
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {variantRows.length > 0 && (
          <div className="mt-5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t("entry.variants")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {variantRows.map(({ dialect, forms, state }, index) => (
                <span
                  key={`${dialect}-${state}-${index}`}
                  className="inline-flex max-w-full items-start gap-2 rounded-lg border border-line bg-elevated/65 px-3 py-2 text-sm text-ink"
                >
                  <span className="inline-flex min-h-6 shrink-0 items-center rounded-md bg-surface px-2 text-[10px] font-bold text-muted">
                    <DialectSiglum siglum={dialect} />
                  </span>
                  <span
                    className={`${antinoou.className} min-w-0 break-words text-base leading-snug [overflow-wrap:anywhere]`}
                  >
                    <HighlightText
                      text={forms.join(", ")}
                      query={query}
                      symbolTooltips={formSymbolTooltips}
                    />
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
        {imperativeForms.length > 0 && primaryDialectKey && (
          <div className="mt-5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t("entry.imperatives")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex max-w-full items-start gap-2 rounded-lg border border-line bg-elevated/65 px-3 py-2 text-sm text-ink">
                <span className="inline-flex min-h-6 shrink-0 items-center rounded-md bg-surface px-2 text-[10px] font-bold text-muted">
                  <DialectSiglum siglum={primaryDialectKey} />
                </span>
                <span
                  className={`${antinoou.className} min-w-0 break-words text-base leading-snug [overflow-wrap:anywhere]`}
                >
                  <HighlightText
                    text={formatImperativeForms(imperativeForms)}
                    query={query}
                    symbolTooltips={formSymbolTooltips}
                  />
                </span>
              </span>
            </div>
          </div>
        )}

        {(entry.greek?.length ?? 0) > 0 && (
          <div className="mt-5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t("entry.greekEquivalents")}
            </span>
            <div className="flex flex-wrap gap-2">
              {entry.greek?.map((gr, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-coptic/20 bg-coptic-soft px-3 py-1.5 text-sm font-medium text-coptic"
                >
                  <HighlightText text={gr} query={query} />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {actions && !isDetailView ? (
        <div className="mt-7 border-t border-line pt-5">{actions}</div>
      ) : null}

      {remainingDialects.length > 0 && (
        <div className="mt-7 border-t border-line pt-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            {t("entry.dialectForms")}
          </h4>
          <div className="flex flex-wrap gap-3">
            {remainingDialects.map(([dialect, forms]) => {
              const spelling = formatDialectForms(forms, entry.headword);
              const dialectPlurals = getDialectPluralForms(entry, dialect);
              const visibleDialectPlurals = dialectPlurals.filter(
                (pluralForm) => pluralForm.trim() !== spelling.trim(),
              );
              const genderedDialectParts = getGenderedDialectFormParts(
                entry,
                dialect,
              );
              const hasGenderedDialectParts = genderedDialectParts.length > 0;
              const dialectAriaSpelling = hasGenderedDialectParts
                ? genderedDialectParts
                    .map((part) => `${part.spelling} ${part.marker}`)
                    .join(" ")
                : spelling;

              return (
                <button
                  key={dialect}
                  type="button"
                  onClick={() => handleDialectViewChange(dialect)}
                  aria-label={`${t("entry.dialectForms")}: ${dialect} ${dialectAriaSpelling}`}
                  className="flex min-w-0 max-w-full basis-full cursor-pointer select-none items-start gap-3 rounded-lg border border-line bg-elevated/65 px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-px hover:border-coptic/35 hover:bg-coptic-soft/45 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coptic/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:basis-auto"
                >
                  <span className="inline-flex min-h-7 shrink-0 items-center rounded-md bg-surface px-2.5 py-2 text-[10px] font-bold text-muted">
                    <DialectSiglum focusableTooltip={false} siglum={dialect} />
                  </span>
                  <span className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {hasGenderedDialectParts ? (
                      <>
                        {genderedDialectParts.map((part) => (
                          <span
                            key={`${dialect}-${part.entryId ?? entry.id}-${part.marker}-${part.spelling}`}
                            className="inline-flex min-w-0 items-baseline gap-x-1.5"
                          >
                            <span
                              className={`${antinoou.className} block break-words text-lg leading-snug text-ink [overflow-wrap:anywhere]`}
                            >
                              <HighlightText
                                text={part.spelling}
                                query={query}
                                symbolTooltips={formSymbolTooltips}
                              />
                            </span>
                            <LinguisticGloss
                              code={part.marker}
                              label={getGenderedHeadingMarkerLabel(
                                part.marker,
                                t,
                              )}
                              size="compact"
                              focusable={false}
                            />
                          </span>
                        ))}
                      </>
                    ) : (
                      <span
                        className={`${antinoou.className} block break-words text-lg leading-snug text-ink [overflow-wrap:anywhere]`}
                      >
                        <HighlightText
                          text={spelling}
                          query={query}
                          symbolTooltips={formSymbolTooltips}
                        />
                      </span>
                    )}
                    {showInlinePos && !hasGenderedDialectParts && (
                      <LinguisticGloss
                        code={partOfSpeechCode}
                        label={partOfSpeechLabel}
                        size="compact"
                        focusable={false}
                      />
                    )}
                    {mainGenderMarkers.length > 0 &&
                      !hasGenderedDialectParts && (
                        <LinguisticGlossGroup
                          markers={mainGenderMarkers}
                          size="compact"
                          focusable={false}
                        />
                      )}
                    {dialectPlurals.length > 0 && !hasGenderedDialectParts && (
                      <>
                        {visibleDialectPlurals[0] && (
                          <span
                            className={`${antinoou.className} block break-words text-lg leading-snug text-ink [overflow-wrap:anywhere]`}
                          >
                            <HighlightText
                              text={visibleDialectPlurals[0]}
                              query={query}
                              symbolTooltips={formSymbolTooltips}
                            />
                          </span>
                        )}
                        <LinguisticGloss
                          code="pl"
                          label={t("entry.abbreviation.pl")}
                          size="compact"
                          focusable={false}
                        />
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
