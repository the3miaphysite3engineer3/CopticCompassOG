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

/**
 * Computes the minimum mobile table width that keeps grammar tables readable
 * when they overflow horizontally.
 */
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

/**
 * Renders the card-based mobile fallback for tables that opt into the `cards`
 * layout on small screens.
 */
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
        <GrammarLessonCard key={row.id} className="space-y-3 bg-elevated/70">
          {block.columns.map((column, columnIndex) => (
            <div
              key={column.id}
              className={cx(
                "space-y-1.5",
                columnIndex > 0 && "border-t border-line pt-3",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {renderTableColumnLabel(column, language, lessonBundle)}
              </p>
              <div className="text-sm leading-6 text-ink [&_.font-coptic]:text-base [&_p]:leading-6">
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

/**
 * Renders one structured grammar table block in either scrollable-table or
 * mobile-card form depending on the block config and render mode.
 */
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
  const tableHeader = (() => {
    if (useCustomHeaderRows) {
      return (
        <thead>
          {block.headerRows?.map((headerRow) => (
            <tr key={headerRow.id} className="bg-elevated">
              {headerRow.cells.map((cell) => (
                <th
                  key={cell.id}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  className={cx(
                    "border-b border-line px-3 py-2 text-sm font-semibold leading-5 sm:p-3 sm:text-base",
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
      );
    }

    if (block.hideHeader) {
      return null;
    }

    return (
      <thead>
        <tr className="bg-elevated">
          {block.columns.map((column) => (
            <th
              key={column.id}
              className="border-b border-line px-3 py-2 text-center text-sm font-semibold leading-5 sm:p-3 sm:text-base"
            >
              {renderTableColumnLabel(column, language, lessonBundle)}
            </th>
          ))}
        </tr>
      </thead>
    );
  })();

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
      {tableHeader}
      <tbody className="divide-y divide-line">
        {block.rows.map((row) => (
          <tr
            key={row.id}
            className={cx(
              "group/row transition-colors",
              useRowHeaderLayout ? "align-middle" : "align-top",
            )}
          >
            {block.columns.map((column) => {
              const isRowHeader = column.id === block.rowHeaderColumnId;

              if (isRowHeader) {
                return (
                  <th
                    key={column.id}
                    scope="row"
                    className="sticky left-0 z-10 w-28 border-r border-line bg-elevated px-3 py-2 text-left text-sm font-semibold text-ink shadow-[10px_0_16px_-14px_rgba(30,29,29,0.45)] transition-colors group-hover/row:border-coptic/25 group-hover/row:bg-coptic-soft/60 sm:static sm:w-32 sm:px-4 sm:py-3 sm:text-base sm:shadow-none [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7"
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
                  className={cx(
                    "transition-colors group-hover/row:bg-coptic-soft/35",
                    useRowHeaderLayout
                      ? "w-[22.66%] px-2.5 py-2 text-center align-middle text-sm group-hover/row:text-ink sm:px-4 sm:py-3 sm:text-base [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7"
                      : "px-3 py-2 text-sm group-hover/row:text-ink sm:p-3 sm:text-base [&_.font-coptic]:text-base sm:[&_.font-coptic]:text-lg [&_p]:leading-6 sm:[&_p]:leading-7",
                  )}
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
