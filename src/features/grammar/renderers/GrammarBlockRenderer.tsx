"use client";

import type {
  GrammarBlock,
  GrammarLessonBundle,
  GrammarTableColumn,
} from "@/content/grammar/schema";
import type { Language } from "@/types/i18n";
import { cx } from "@/lib/classes";
import { getEntryPath } from "@/lib/locale";
import {
  GrammarLessonCard,
  GrammarLessonTable,
} from "@/features/grammar/components/GrammarLessonPrimitives";
import { useGrammarLessonRenderContext } from "@/features/grammar/components/GrammarLessonRenderContext";
import { ExerciseForm } from "@/features/grammar/components/ExerciseForm";
import { Footnote } from "@/features/grammar/components/Footnote";
import { GrammarInlineRenderer } from "./GrammarInlineRenderer";

type GrammarBlockRendererProps = {
  blocks: readonly GrammarBlock[];
  language: Language;
  lessonBundle?: GrammarLessonBundle;
  className?: string;
  inheritTextColor?: boolean;
};

function renderExampleCopticText(text: string) {
  if (text.startsWith("Ø-")) {
    return (
      <>
        <sup className="text-sm font-semibold not-italic">Ø</sup>-
        {text.slice(2)}
      </>
    );
  }

  return text;
}

function renderDictionaryEntryHref(
  dictionaryEntryId: string,
  language: Language,
) {
  return getEntryPath(encodeURIComponent(dictionaryEntryId), language);
}

function renderExampleCopticSegments(
  coptic: string,
  dictionaryEntryId: string | undefined,
  index: number,
  language: Language,
) {
  const content = renderExampleCopticText(coptic);

  if (!dictionaryEntryId) {
    return <span key={`segment-${index}`}>{content}</span>;
  }

  return (
    <a
      key={`segment-${index}`}
      href={renderDictionaryEntryHref(dictionaryEntryId, language)}
      target="_blank"
      rel="noreferrer noopener"
      data-dictionary-entry-id={dictionaryEntryId}
      className="no-underline"
    >
      {content}
    </a>
  );
}

function renderFootnoteRef(
  ref: string,
  key: string,
  language: Language,
  lessonBundle: GrammarLessonBundle | undefined,
  inheritTextColor: boolean,
) {
  const footnote = lessonBundle?.footnotes.find((item) => item.id === ref);

  if (!footnote || !lessonBundle) {
    return (
      <sup key={key} className="text-xs font-semibold text-sky-700 dark:text-sky-300">
        [{ref}]
      </sup>
    );
  }

  const number = lessonBundle.footnotes.findIndex((item) => item.id === ref) + 1;

  return (
    <Footnote
      key={key}
      number={number}
      content={
        <GrammarBlockRenderer
          blocks={footnote.content[language]}
          language={language}
          lessonBundle={lessonBundle}
          className="space-y-2"
          inheritTextColor={inheritTextColor}
        />
      }
    />
  );
}

function renderExerciseGroup(
  exerciseIds: readonly string[],
  lessonBundle: GrammarLessonBundle | undefined,
  language: Language,
) {
  const exercises =
    lessonBundle?.exercises.filter((exercise) => exerciseIds.includes(exercise.id)) ?? [];

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <GrammarLessonCard key={exercise.id} tone="sky" className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {exercise.title[language]}
            </h3>
            <div className="mt-2 text-sm leading-7 text-stone-700 dark:text-stone-300">
              <GrammarBlockRenderer
                blocks={exercise.prompt[language]}
                language={language}
                lessonBundle={lessonBundle}
              />
            </div>
          </div>
          <ExerciseForm
            lessonSlug={lessonBundle?.lesson.slug ?? exercise.lessonId}
            exerciseId={exercise.id}
            language={language}
            questions={exercise.items.map((item) => ({
              id: item.id,
              prompt: item.prompt[language],
              minLength: item.answerSchema?.minLength,
              maxLength: item.answerSchema?.maxLength,
            }))}
          />
        </GrammarLessonCard>
      ))}
    </div>
  );
}

function renderExampleGroup(
  exampleIds: readonly string[],
  lessonBundle: GrammarLessonBundle | undefined,
  language: Language,
  columns: 1 | 2 = 1,
) {
  const examples =
    lessonBundle?.examples.filter((example) => exampleIds.includes(example.id)) ?? [];

  if (examples.length === 0) {
    return null;
  }

  const renderExampleList = (items: typeof examples) => (
    <ul className="space-y-3">
      {items.map((example) => (
        <li key={example.id} className="leading-7 text-stone-700 dark:text-stone-300">
          <span className="font-coptic text-xl text-emerald-600 dark:text-emerald-400">
            {example.copticSegments && example.copticSegments.length > 0
              ? example.copticSegments.map((segment, segmentIndex) =>
                  renderExampleCopticSegments(
                    segment.text,
                    segment.dictionaryEntryId,
                    segmentIndex,
                    language,
                  ),
                )
              : example.dictionaryRefs.length === 1 &&
                  !/\s/.test(example.coptic.trim()) ? (
                  <a
                    href={renderDictionaryEntryHref(example.dictionaryRefs[0] ?? "", language)}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-dictionary-entry-id={example.dictionaryRefs[0]}
                    className="no-underline"
                  >
                    {renderExampleCopticText(example.coptic)}
                  </a>
                ) : (
                  renderExampleCopticText(example.coptic)
                )}
          </span>
          <span className="ml-3">{example.translation[language]}</span>
        </li>
      ))}
    </ul>
  );

  if (columns === 2 && examples.length > 1) {
    const splitIndex = Math.ceil(examples.length / 2);
    const firstColumn = examples.slice(0, splitIndex);
    const secondColumn = examples.slice(splitIndex);

    return (
      <GrammarLessonCard className="space-y-3">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div>{renderExampleList(firstColumn)}</div>
          <div>{renderExampleList(secondColumn)}</div>
        </div>
      </GrammarLessonCard>
    );
  }

  return <GrammarLessonCard className="space-y-3">{renderExampleList(examples)}</GrammarLessonCard>;
}

function getTableMobileMinWidthRem(
  columnCount: number,
  useRowHeaderLayout: boolean,
) {
  if (useRowHeaderLayout) {
    return 34;
  }

  if (columnCount >= 4) {
    return 40;
  }

  if (columnCount === 3) {
    return 34;
  }

  return 28;
}

function renderTableColumnLabel(
  column: GrammarTableColumn,
  language: Language,
  lessonBundle: GrammarLessonBundle | undefined,
) {
  return column.inlineLabel ? (
    <GrammarInlineRenderer
      nodes={column.inlineLabel[language]}
      language={language}
      lessonId={lessonBundle?.lesson.id}
    />
  ) : (
    column.label[language]
  );
}

function renderTableMobileCards(
  block: Extract<GrammarBlock, { type: "table" }>,
  language: Language,
  lessonBundle: GrammarLessonBundle | undefined,
  inheritTextColor: boolean,
) {
  return (
    <div
      data-grammar-table-id={block.id}
      data-grammar-table-mobile-layout="cards"
      data-grammar-table-rendering="cards"
      className="space-y-3 sm:hidden"
    >
      {block.rows.map((row) => (
        <GrammarLessonCard
          key={row.id}
          className="space-y-3 bg-stone-50/80 dark:bg-stone-950/45"
        >
          {block.columns.map((column, columnIndex) => (
            <div
              key={column.id}
              className={cx(
                "space-y-1.5",
                columnIndex > 0 &&
                  "border-t border-stone-200/80 pt-3 dark:border-stone-800/80",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                {renderTableColumnLabel(column, language, lessonBundle)}
              </p>
              <div className="text-sm leading-6 text-stone-800 dark:text-stone-200 [&_.font-coptic]:text-base [&_p]:leading-6">
                <GrammarBlockRenderer
                  blocks={row.cells[column.id] ?? []}
                  language={language}
                  lessonBundle={lessonBundle}
                  className="space-y-2"
                  inheritTextColor={inheritTextColor}
                />
              </div>
            </div>
          ))}
        </GrammarLessonCard>
      ))}
    </div>
  );
}

function renderBlock(
  block: GrammarBlock,
  index: number,
  language: Language,
  lessonBundle: GrammarLessonBundle | undefined,
  inheritTextColor: boolean,
  renderMode: "web" | "pdf",
) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          key={`${block.type}-${index}`}
          className={cx(
            "leading-7",
            inheritTextColor ? "text-inherit" : "text-stone-700 dark:text-stone-300",
          )}
        >
          <GrammarInlineRenderer
            nodes={block.content}
            language={language}
            lessonId={lessonBundle?.lesson.id}
            renderFootnoteRef={(ref, key) =>
              renderFootnoteRef(ref, key, language, lessonBundle, inheritTextColor)
            }
          />
        </p>
      );
    case "heading": {
      const HeadingTag = block.level === 2 ? "h2" : "h3";

      return (
        <HeadingTag
          key={`${block.type}-${block.id}`}
          id={block.id}
          className={cx(
            "font-semibold text-stone-900 dark:text-stone-100",
            block.level === 2 ? "text-2xl" : "text-xl",
          )}
        >
          <GrammarInlineRenderer
            nodes={block.content}
            language={language}
            lessonId={lessonBundle?.lesson.id}
            renderFootnoteRef={(ref, key) =>
              renderFootnoteRef(ref, key, language, lessonBundle, inheritTextColor)
            }
          />
        </HeadingTag>
      );
    }
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul";

      return (
        <ListTag
          key={`${block.type}-${index}`}
          className={cx(
            "ml-5 space-y-3",
            block.style === "ordered" ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item) => (
            <li
              key={item.id}
              className={cx(
                "space-y-3",
                inheritTextColor ? "text-inherit" : "text-stone-700 dark:text-stone-300",
              )}
            >
              <GrammarBlockRenderer
                blocks={item.blocks}
                language={language}
                lessonBundle={lessonBundle}
                inheritTextColor={inheritTextColor}
              />
            </li>
          ))}
        </ListTag>
      );
    }
    case "table":
      const useRowHeaderLayout = Boolean(block.hideHeader && block.rowHeaderColumnId);
      const useCustomHeaderRows = Boolean(block.headerRows && block.headerRows.length > 0);
      const useFixedLayout = block.tableLayout === "fixed" || useRowHeaderLayout;
      const hasExplicitColumnWidths = block.columns.some((column) => column.width);
      const mobileMinWidthRem = getTableMobileMinWidthRem(
        block.columns.length,
        useRowHeaderLayout,
      );
      const useMobileCards =
        renderMode === "web" && block.mobileLayout === "cards";

      const tableElement = (
        <GrammarLessonTable
          className={useMobileCards ? "hidden sm:block" : undefined}
          hasStickyLeadingColumn={useRowHeaderLayout}
          mobileMinWidthRem={mobileMinWidthRem}
          mobileLayout={block.mobileLayout ?? "scroll"}
          tableId={block.id}
          tableClassName={useFixedLayout ? "table-fixed" : undefined}
        >
          {hasExplicitColumnWidths ? (
            <colgroup>
              {block.columns.map((column) => (
                <col
                  key={column.id}
                  style={column.width ? { width: column.width } : undefined}
                />
              ))}
            </colgroup>
          ) : null}
          {useCustomHeaderRows ? (
            <thead>
              {block.headerRows?.map((headerRow) => (
                <tr
                  key={headerRow.id}
                  className="bg-stone-100 dark:bg-stone-800"
                >
                  {headerRow.cells.map((cell) => (
                    <th
                      key={cell.id}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={cx(
                        "border-b px-3 py-2 text-sm font-semibold leading-5 dark:border-stone-700 sm:p-3 sm:text-base",
                        cell.align === "center" && "text-center",
                        cell.align === "right" && "text-right",
                        (!cell.align || cell.align === "left") && "text-center",
                      )}
                    >
                      {cell.inlineLabel ? (
                        <GrammarInlineRenderer
                          nodes={cell.inlineLabel[language]}
                          language={language}
                          lessonId={lessonBundle?.lesson.id}
                        />
                      ) : (
                        cell.label[language]
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          ) : block.hideHeader ? null : (
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-800">
                {block.columns.map((column) => (
                  <th
                    key={column.id}
                    className="border-b px-3 py-2 text-center text-sm font-semibold leading-5 dark:border-stone-700 sm:p-3 sm:text-base"
                  >
                    {renderTableColumnLabel(column, language, lessonBundle)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {block.rows.map((row) => (
              <tr key={row.id} className={useRowHeaderLayout ? "align-middle" : "align-top"}>
                {block.columns.map((column) => {
                  const isRowHeader = column.id === block.rowHeaderColumnId;

                  if (isRowHeader) {
                    return (
                      <th
                        key={column.id}
                        scope="row"
                        className="sticky left-0 z-10 w-28 border-r border-stone-200 bg-stone-100 px-3 py-2 text-left text-sm font-semibold text-stone-900 shadow-[10px_0_16px_-14px_rgba(28,25,23,0.45)] dark:border-stone-700 dark:bg-stone-800/95 dark:text-stone-100 dark:shadow-[10px_0_18px_-14px_rgba(0,0,0,0.7)] sm:static sm:w-32 sm:px-4 sm:py-3 sm:text-base sm:shadow-none [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7"
                      >
                        <GrammarBlockRenderer
                          blocks={row.cells[column.id] ?? []}
                          language={language}
                          lessonBundle={lessonBundle}
                          inheritTextColor
                        />
                      </th>
                    );
                  }

                  return (
                    <td
                      key={column.id}
                      className={
                        useRowHeaderLayout
                          ? "w-[22.66%] px-2.5 py-2 text-center align-middle text-sm sm:px-4 sm:py-3 sm:text-base [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7"
                          : "px-3 py-2 text-sm sm:p-3 sm:text-base [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7"
                      }
                    >
                      <GrammarBlockRenderer
                        blocks={row.cells[column.id] ?? []}
                        language={language}
                        lessonBundle={lessonBundle}
                        inheritTextColor={inheritTextColor}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </GrammarLessonTable>
      );

      return useMobileCards ? (
        <div key={`${block.type}-${block.id}`} className="space-y-4">
          {renderTableMobileCards(
            block,
            language,
            lessonBundle,
            inheritTextColor,
          )}
          {tableElement}
        </div>
      ) : (
        <div key={`${block.type}-${block.id}`}>{tableElement}</div>
      );
    case "callout":
      return (
        <GrammarLessonCard
          key={`${block.type}-${index}`}
          tone={block.tone === "info" ? "sky" : "stone"}
          className={cx(
            "space-y-3",
            block.tone === "warning" &&
              "border-amber-200 bg-amber-50 dark:border-amber-900/80 dark:bg-amber-950/30",
          )}
        >
          {block.title ? (
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {block.title[language]}
            </h3>
          ) : null}
          <GrammarBlockRenderer
            blocks={block.blocks}
            language={language}
            lessonBundle={lessonBundle}
            inheritTextColor={inheritTextColor}
          />
        </GrammarLessonCard>
      );
    case "exampleGroup":
      return (
        <div key={`${block.type}-${index}`}>
          {renderExampleGroup(block.refs, lessonBundle, language, block.columns)}
        </div>
      );
    case "exerciseGroup":
      return (
        <div key={`${block.type}-${index}`}>
          {renderExerciseGroup(block.refs, lessonBundle, language)}
        </div>
      );
    default: {
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}

export function GrammarBlockRenderer({
  blocks,
  language,
  lessonBundle,
  className,
  inheritTextColor = false,
}: GrammarBlockRendererProps) {
  const { renderMode } = useGrammarLessonRenderContext();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cx("space-y-4", className)}>
      {blocks.map((block, index) =>
        renderBlock(
          block,
          index,
          language,
          lessonBundle,
          inheritTextColor,
          renderMode,
        ),
      )}
    </div>
  );
}
