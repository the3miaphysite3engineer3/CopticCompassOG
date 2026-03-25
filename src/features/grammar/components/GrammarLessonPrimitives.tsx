"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/classes";
import { useLanguage } from "@/components/LanguageProvider";
import { useGrammarLessonRenderContext } from "./GrammarLessonRenderContext";

type GrammarLessonSectionProps = {
  id: string;
  index: number;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  footer?: ReactNode;
  openOnHashMatch?: boolean;
};

type GrammarLessonCardProps = {
  children: ReactNode;
  className?: string;
  tone?: "sky" | "stone";
};

type GrammarLessonTableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
  mobileMinWidthRem?: number;
  hasStickyLeadingColumn?: boolean;
  tableId?: string;
  mobileLayout?: "scroll" | "cards";
};

type GrammarLessonOutlineProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
  sections: readonly {
    id: string;
    title: ReactNode;
  }[];
};

export function GrammarLessonSection({
  id,
  index,
  title,
  children,
  className,
  defaultOpen = true,
  footer,
  openOnHashMatch = false,
}: GrammarLessonSectionProps) {
  const { renderMode } = useGrammarLessonRenderContext();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!openOnHashMatch || renderMode === "pdf") {
      return;
    }

    function revealHashTarget() {
      const detailsElement = detailsRef.current;
      const hash = window.location.hash;

      if (!detailsElement || !hash) {
        return;
      }

      const targetId = decodeURIComponent(hash.slice(1));
      const targetElement = document.getElementById(targetId);

      if (!targetElement) {
        return;
      }

      if (targetElement === detailsElement || detailsElement.contains(targetElement)) {
        detailsElement.open = true;

        window.requestAnimationFrame(() => {
          targetElement.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      }
    }

    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);

    return () => {
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, [openOnHashMatch, renderMode]);

  return (
    <details
      ref={detailsRef}
      id={id}
      open={renderMode === "pdf" ? true : defaultOpen}
      className={cx(
        "group scroll-mt-28 overflow-hidden rounded-2xl border border-stone-200/90 bg-white/55 shadow-sm backdrop-blur-sm dark:border-stone-800/90 dark:bg-stone-950/30",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
            {String(index).padStart(2, "0")}
          </span>
          <h2 className="min-w-0 text-lg font-semibold text-stone-900 dark:text-stone-100 sm:text-xl md:text-2xl">
            {title}
          </h2>
        </div>
        <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-180 dark:text-stone-500" />
      </summary>
      <div className="border-t border-stone-200/80 px-4 pb-4 pt-4 dark:border-stone-800/80 sm:px-5 sm:pb-5">
        {children}
        {renderMode !== "pdf" && footer ? (
          <div className="mt-5 border-t border-stone-200/80 pt-4 dark:border-stone-800/80">
            {footer}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function GrammarLessonOutline({
  title,
  eyebrow,
  className,
  sections,
}: GrammarLessonOutlineProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <nav
      className={cx(
        "overflow-hidden rounded-2xl border border-stone-200/90 bg-white/70 shadow-sm backdrop-blur-sm dark:border-stone-800/90 dark:bg-stone-950/40",
        className
      )}
    >
      <div className="border-b border-stone-200/80 px-4 py-3 dark:border-stone-800/80 sm:px-5 sm:py-4">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h2>
          <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
            {String(sections.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <ol className="divide-y divide-stone-200/80 dark:divide-stone-800/80">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group flex items-start gap-4 px-4 py-3 transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-900/60 sm:px-5"
            >
              <span className="w-6 shrink-0 pt-0.5 text-xs font-semibold text-stone-400 transition-colors group-hover:text-sky-600 dark:text-stone-500 dark:group-hover:text-sky-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium text-stone-700 transition-colors group-hover:text-sky-700 dark:text-stone-300 dark:group-hover:text-sky-300">
                {section.title}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function GrammarLessonCard({
  children,
  className,
  tone = "stone",
}: GrammarLessonCardProps) {
  return (
    <div
      className={cx(
        "rounded-xl border p-4",
        tone === "sky"
          ? "border-sky-100 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/30"
          : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GrammarLessonTable({
  children,
  className,
  tableClassName,
  mobileMinWidthRem,
  hasStickyLeadingColumn = false,
  tableId,
  mobileLayout = "scroll",
}: GrammarLessonTableProps) {
  const { renderMode } = useGrammarLessonRenderContext();
  const { language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollHorizontally, setCanScrollHorizontally] = useState(false);
  const [isScrolledToStart, setIsScrolledToStart] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(true);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || renderMode === "pdf") {
      return;
    }

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(
        0,
        scrollContainer.scrollWidth - scrollContainer.clientWidth,
      );
      const canScroll = maxScrollLeft > 8;

      setCanScrollHorizontally(canScroll);
      setIsScrolledToStart(!canScroll || scrollContainer.scrollLeft <= 4);
      setIsScrolledToEnd(
        !canScroll || scrollContainer.scrollLeft >= maxScrollLeft - 4,
      );
    };

    const frame = window.requestAnimationFrame(updateScrollState);
    scrollContainer.addEventListener("scroll", updateScrollState, {
      passive: true,
    });

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState();
      });
      resizeObserver.observe(scrollContainer);

      const tableElement = scrollContainer.querySelector("table");

      if (tableElement) {
        resizeObserver.observe(tableElement);
      }
    } else {
      window.addEventListener("resize", updateScrollState);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      scrollContainer.removeEventListener("scroll", updateScrollState);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [language, mobileMinWidthRem, renderMode]);

  const mobileScrollHint =
    hasStickyLeadingColumn
      ? language === "en"
        ? "Swipe sideways. Labels stay pinned."
        : "Veeg zijwaarts. Labels blijven staan."
      : language === "en"
        ? "Swipe sideways to compare"
        : "Veeg zijwaarts om te vergelijken";
  const tableStyle =
    renderMode === "pdf" || !mobileMinWidthRem
      ? undefined
      : { minWidth: `max(100%, ${mobileMinWidthRem}rem)` };

  return (
    <div
      data-grammar-table-id={tableId}
      data-grammar-table-mobile-layout={mobileLayout}
      data-grammar-table-rendering="table"
      className={cx(
        "mt-4 -mx-4 overflow-hidden border border-stone-200 dark:border-stone-800 sm:mx-0 sm:rounded-lg",
        className,
      )}
    >
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className={cx(
            renderMode === "pdf"
              ? "overflow-visible"
              : "overflow-x-auto overscroll-x-contain touch-pan-x",
          )}
        >
          <table
            style={tableStyle}
            className={cx("w-full border-collapse text-left", tableClassName)}
          >
            {children}
          </table>
        </div>

        {renderMode !== "pdf" && canScrollHorizontally ? (
          <>
            {!hasStickyLeadingColumn && !isScrolledToStart ? (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-stone-950 dark:via-stone-950/80 sm:hidden" />
            ) : null}
            {!isScrolledToEnd ? (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/85 to-transparent dark:from-stone-950 dark:via-stone-950/85 sm:hidden" />
            ) : null}
          </>
        ) : null}
      </div>

      {renderMode !== "pdf" && canScrollHorizontally && isScrolledToStart ? (
        <div className="border-t border-stone-200/80 bg-stone-50/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500 dark:border-stone-800/80 dark:bg-stone-950/45 dark:text-stone-400 sm:hidden">
          {mobileScrollHint}
        </div>
      ) : null}
    </div>
  );
}

type GrammarLessonEndnotesProps = {
  title: ReactNode;
  className?: string;
};

export function GrammarLessonEndnotes({
  title,
  className,
}: GrammarLessonEndnotesProps) {
  const { footnotes, renderMode } = useGrammarLessonRenderContext();

  if (renderMode !== "pdf" || footnotes.length === 0) {
    return null;
  }

  return (
    <section
      className={cx(
        "rounded-2xl border border-stone-200/90 bg-white/70 px-5 py-5 shadow-sm dark:border-stone-800/90 dark:bg-stone-950/35",
        className,
      )}
    >
      <h2 className="mb-4 text-2xl font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h2>
      <ol className="space-y-4">
        {footnotes.map((footnote) => (
          <li key={footnote.number} className="flex items-start gap-3">
            <span className="w-8 shrink-0 text-sm font-semibold text-sky-700 dark:text-sky-300">
              [{footnote.number}]
            </span>
            <div className="min-w-0 text-sm leading-7 text-stone-700 dark:text-stone-300">
              {footnote.content}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
