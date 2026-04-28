"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { FloatingTooltip } from "@/components/FloatingTooltip";
import { useLanguage } from "@/components/LanguageProvider";
import {
  interactiveTooltipBubbleClassName,
  tooltipArrowClassName,
} from "@/components/MicroTooltip";
import { cx } from "@/lib/classes";
import { getLoginPath } from "@/lib/supabase/config";

type AuthGatedActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: ReactNode;
  isAuthenticated: boolean;
  isReady: boolean;
  lockedOpen?: boolean;
  lockedContent?: ReactNode;
  lockedMessage: string;
  onLockedOpenChange?: (visible: boolean) => void;
  tooltipClassName?: string;
  wrapperClassName?: string;
};

const LOCKED_TOOLTIP_GRACE_MS = 1600;
const LOCKED_TOOLTIP_AUTO_HIDE_MS = 2400;

export function AuthGatedActionButton({
  children,
  className,
  isAuthenticated,
  isReady,
  lockedOpen,
  lockedContent,
  lockedMessage,
  onLockedOpenChange,
  tooltipClassName,
  type = "button",
  wrapperClassName,
  ...buttonProps
}: AuthGatedActionButtonProps) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const suppressNextLockedClickRef = useRef(false);
  const [canHoverLockedButton, setCanHoverLockedButton] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
      : false,
  );
  const [isHoveringLockedButton, setIsHoveringLockedButton] = useState(false);
  const [isHoveringLockedTooltip, setIsHoveringLockedTooltip] = useState(false);
  const [uncontrolledLockedOpen, setUncontrolledLockedOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const isLockedMessageVisible =
    lockedOpen === undefined ? uncontrolledLockedOpen : lockedOpen;
  const loginHref = getLoginPath(pathname ?? undefined);

  const setLockedOpen = (visible: boolean) => {
    if (lockedOpen === undefined) {
      setUncontrolledLockedOpen(visible);
    }

    onLockedOpenChange?.(visible);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => {
      setCanHoverLockedButton(hoverQuery.matches);
    };

    updateHoverCapability();
    hoverQuery.addEventListener("change", updateHoverCapability);

    return () => {
      hoverQuery.removeEventListener("change", updateHoverCapability);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    const tooltipVisible =
      isHoveringLockedButton ||
      isHoveringLockedTooltip ||
      isLockedMessageVisible;
    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const scheduleHideLockedMessage = (delay = LOCKED_TOOLTIP_GRACE_MS) => {
      clearHideTimer();

      hideTimerRef.current = window.setTimeout(() => {
        setIsHoveringLockedTooltip(false);
        setLockedOpen(false);
        hideTimerRef.current = null;
      }, delay);
    };

    const hideLockedMessage = () => {
      clearHideTimer();
      setIsHoveringLockedTooltip(false);
      setLockedOpen(false);
    };

    const showLockedMessage = (autoHideMs = LOCKED_TOOLTIP_AUTO_HIDE_MS) => {
      setLockedOpen(true);
      clearHideTimer();

      hideTimerRef.current = window.setTimeout(() => {
        setLockedOpen(false);
        hideTimerRef.current = null;
      }, autoHideMs);
    };

    const showHoverLockedMessage = () => {
      if (!canHoverLockedButton) {
        setCanHoverLockedButton(true);
      }

      clearHideTimer();
      setLockedOpen(true);
    };

    return (
      <div className={cx("group relative inline-block", wrapperClassName)}>
        <button
          ref={buttonRef}
          type={type}
          aria-describedby={tooltipVisible ? tooltipId : undefined}
          data-locked="true"
          className={cx(className, "cursor-not-allowed opacity-50")}
          onPointerDown={(event) => {
            if (canHoverLockedButton || !isLockedMessageVisible) {
              return;
            }

            event.preventDefault();
            suppressNextLockedClickRef.current = true;
            hideLockedMessage();
          }}
          onTouchStart={(event) => {
            if (canHoverLockedButton || !isLockedMessageVisible) {
              return;
            }

            event.preventDefault();
            suppressNextLockedClickRef.current = true;
            hideLockedMessage();
          }}
          onClick={(event) => {
            event.preventDefault();

            if (suppressNextLockedClickRef.current) {
              suppressNextLockedClickRef.current = false;
              return;
            }

            if (
              isLockedMessageVisible &&
              !(canHoverLockedButton && isHoveringLockedButton)
            ) {
              hideLockedMessage();
              return;
            }

            showLockedMessage();
          }}
          onMouseEnter={() => {
            setIsHoveringLockedButton(true);
            showHoverLockedMessage();
          }}
          onMouseLeave={() => {
            setIsHoveringLockedButton(false);
            scheduleHideLockedMessage();
          }}
        >
          {lockedContent ?? (
            <>
              <Lock className="h-4 w-4" />
              {children}
            </>
          )}
        </button>
        <FloatingTooltip
          anchorRef={buttonRef}
          className={cx(interactiveTooltipBubbleClassName, tooltipClassName)}
          arrowClassName={tooltipArrowClassName}
          id={tooltipId}
          isOpen={tooltipVisible}
          onMouseEnter={() => {
            setIsHoveringLockedTooltip(true);
            showHoverLockedMessage();
          }}
          onMouseLeave={() => {
            setIsHoveringLockedTooltip(false);
            scheduleHideLockedMessage();
          }}
          withArrow
        >
          <div className="space-y-3">
            <p>{lockedMessage}</p>
            <Link
              href={loginHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-stone-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              {t("nav.login")}
            </Link>
          </div>
        </FloatingTooltip>
      </div>
    );
  }

  return (
    <button type={type} className={className} {...buttonProps}>
      {children}
    </button>
  );
}
