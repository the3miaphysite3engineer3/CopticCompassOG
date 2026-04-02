"use client";

import type {
  GrammarBlock,
  GrammarTableColumn,
} from "@/content/grammar/schema";
import {
  GrammarLessonCard,
  GrammarLessonTable,
} from "@/features/grammar/components/GrammarLessonPrimitives";
import { cx } from "@/lib/classes";
import { GrammarInlineRenderer } from "./GrammarInlineRenderer";
import type {
  GrammarBlockRenderHelperProps,
  GrammarRenderMode,
} from "./grammarBlockRendererShared";

type GrammarTableBlockRendererProps = GrammarBlockRenderHelperProps & {
  block: Extract<GrammarBlock, { type: "table" }>;
  renderMode: GrammarRenderMode;
};

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
  language: GrammarBlockRenderHelperProps["language"],
  lessonBundle: GrammarBlockRenderHelperProps["lessonBundle"],
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

function GrammarTableMobileCards({
  block,
  inheritTextColor,
  language,
  lessonBundle,
  renderBlocks,
}: Omit<GrammarTableBlockRendererProps, "renderMode">) {
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
                {renderBlocks(row.cells[column.id] ?? [], {
                  className: "space-y-2",
                  inheritTextColor,
                })}
              </div>
            </div>
          ))}
        </GrammarLessonCard>
      ))}
    </div>
  );
}

export function GrammarTableBlockRenderer({
  block,
  inheritTextColor,
  language,
  lessonBundle,
  renderBlocks,
  renderMode,
}: GrammarTableBlockRendererProps) {
  const useRowHeaderLayout = Boolean(
    block.hideHeader && block.rowHeaderColumnId,
  );
  const useCustomHeaderRows = Boolean(
    block.headerRows && block.headerRows.length > 0,
  );
  const useFixedLayout = block.tableLayout === "fixed" || useRowHeaderLayout;
  const hasExplicitColumnWidths = block.columns.some((column) => column.width);
  const mobileMinWidthRem = getTableMobileMinWidthRem(
    block.columns.length,
    useRowHeaderLayout,
  );
  const useMobileCards = renderMode === "web" && block.mobileLayout === "cards";

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
            <tr key={headerRow.id} className="bg-stone-100 dark:bg-stone-800">
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
          <tr
            key={row.id}
            className={useRowHeaderLayout ? "align-middle" : "align-top"}
          >
            {block.columns.map((column) => {
              const isRowHeader = column.id === block.rowHeaderColumnId;

              if (isRowHeader) {
                return (
                  <th
                    key={column.id}
                    scope="row"
                    className="sticky left-0 z-10 w-28 border-r border-stone-200 bg-stone-100 px-3 py-2 text-left text-sm font-semibold text-stone-900 shadow-[10px_0_16px_-14px_rgba(28,25,23,0.45)] dark:border-stone-700 dark:bg-stone-800/95 dark:text-stone-100 dark:shadow-[10px_0_18px_-14px_rgba(0,0,0,0.7)] sm:static sm:w-32 sm:px-4 sm:py-3 sm:text-base sm:shadow-none [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7"
                  >
                    {renderBlocks(row.cells[column.id] ?? [], {
                      inheritTextColor: true,
                    })}
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
                  {renderBlocks(row.cells[column.id] ?? [], {
                    inheritTextColor,
                  })}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </GrammarLessonTable>
  );

  if (!useMobileCards) {
    return <div>{tableElement}</div>;
  }

  return (
    <div className="space-y-4">
      <GrammarTableMobileCards
        block={block}
        inheritTextColor={inheritTextColor}
        language={language}
        lessonBundle={lessonBundle}
        renderBlocks={renderBlocks}
      />
      {tableElement}
    </div>
  );
}
