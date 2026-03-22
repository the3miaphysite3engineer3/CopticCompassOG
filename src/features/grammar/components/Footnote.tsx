"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/classes";
import { useGrammarLessonRenderContext } from "./GrammarLessonRenderContext";

type FootnoteAlign = "center" | "left" | "right";
type TooltipPlacement = "top" | "bottom";

type TooltipPosition = {
  arrowLeft: number;
  left: number;
  placement: TooltipPlacement;
  top: number;
};

type FootnoteProps = {
  number: number;
  content: ReactNode;
  align?: FootnoteAlign;
};

const VIEWPORT_PADDING = 12;
const TOOLTIP_GAP = 10;
const ARROW_OFFSET = 6;
const ARROW_SAFE_PADDING = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function Footnote({
  number,
  content,
  align = "center",
}: FootnoteProps) {
  const { registerFootnote, renderMode } = useGrammarLessonRenderContext();
  const tooltipId = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(
    null,
  );

  useEffect(() => {
    registerFootnote({ content, number });
  }, [content, number, registerFootnote]);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openTooltip = () => {
    clearCloseTimeout();
    setTooltipPosition(null);
    setIsOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 80);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => {
      setCanHover(mediaQuery.matches);
    };

    updateHoverCapability();
    mediaQuery.addEventListener("change", updateHoverCapability);

    return () => {
      mediaQuery.removeEventListener("change", updateHoverCapability);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current || !tooltipRef.current) {
        return;
      }

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const anchorCenter = anchorRect.left + anchorRect.width / 2;
      const maxLeft = Math.max(
        VIEWPORT_PADDING,
        window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
      );

      const idealLeft =
        align === "left"
          ? anchorRect.left
          : align === "right"
            ? anchorRect.right - tooltipRect.width
            : anchorCenter - tooltipRect.width / 2;

      const left = clamp(idealLeft, VIEWPORT_PADDING, maxLeft);
      const topPlacement = anchorRect.top - tooltipRect.height - TOOLTIP_GAP;
      const bottomPlacement = anchorRect.bottom + TOOLTIP_GAP;

      let placement: TooltipPlacement = "top";
      let top = topPlacement;

      if (topPlacement < VIEWPORT_PADDING) {
        placement = "bottom";
        top = bottomPlacement;
      }

      if (placement === "bottom") {
        top = Math.min(
          bottomPlacement,
          window.innerHeight - tooltipRect.height - VIEWPORT_PADDING,
        );
      } else {
        top = Math.max(topPlacement, VIEWPORT_PADDING);
      }

      const arrowLeft = clamp(
        anchorCenter - left,
        ARROW_SAFE_PADDING,
        tooltipRect.width - ARROW_SAFE_PADDING,
      );

      setTooltipPosition({
        arrowLeft,
        left,
        placement,
        top,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        anchorRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }

      clearCloseTimeout();
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearCloseTimeout();
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  const handleClick = () => {
    if (renderMode === "pdf") {
      return;
    }

    if (canHover) {
      openTooltip();
      return;
    }

    setIsOpen((current) => {
      if (current) {
        return false;
      }

      setTooltipPosition(null);
      return true;
    });
  };

  const tooltip =
    renderMode === "web" && typeof document !== "undefined" && isOpen
    ? createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          onMouseEnter={canHover ? openTooltip : undefined}
          onMouseLeave={canHover ? scheduleClose : undefined}
          className={cx(
            "fixed z-[80] max-w-[min(18rem,calc(100vw-1.5rem))] rounded-xl bg-stone-900 px-3 py-2.5 text-left text-xs leading-relaxed text-stone-100 shadow-2xl dark:bg-stone-200 dark:text-stone-900",
            tooltipPosition ? "opacity-100" : "opacity-0",
          )}
          style={{
            left: tooltipPosition?.left ?? VIEWPORT_PADDING,
            top: tooltipPosition?.top ?? VIEWPORT_PADDING,
            visibility: tooltipPosition ? "visible" : "hidden",
          }}
        >
          {content}
          <span
            className={cx(
              "absolute h-3 w-3 rotate-45 bg-stone-900 dark:bg-stone-200",
              tooltipPosition?.placement === "bottom"
                ? "bottom-full mb-[-6px]"
                : "top-full mt-[-6px]",
            )}
            style={{
              left: (tooltipPosition?.arrowLeft ?? ARROW_SAFE_PADDING) - ARROW_OFFSET,
            }}
          />
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <sup className="ml-0.5 align-super">
        {renderMode === "pdf" ? (
          <span className="inline-flex rounded-sm font-bold text-sky-600 dark:text-sky-400">
            [{number}]
          </span>
        ) : (
          <button
            ref={anchorRef}
            type="button"
            aria-describedby={isOpen ? tooltipId : undefined}
            aria-expanded={isOpen}
            className="inline-flex cursor-help rounded-sm font-bold text-sky-600 outline-none transition-colors hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500/35 dark:text-sky-400 dark:hover:text-sky-300"
            onClick={handleClick}
            onFocus={openTooltip}
            onBlur={canHover ? scheduleClose : undefined}
            onMouseEnter={canHover ? openTooltip : undefined}
            onMouseLeave={canHover ? scheduleClose : undefined}
          >
            [{number}]
          </button>
        )}
      </sup>
      {tooltip}
    </>
  );
}
