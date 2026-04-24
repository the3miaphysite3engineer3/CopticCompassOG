"use client";

import { LoaderCircle, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { cx } from "@/lib/classes";

const FLOATING_ASSISTANT_CONTAINER_CLASS =
  "fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 sm:bottom-5 sm:right-5";

const FLOATING_ASSISTANT_BUTTON_CLASS =
  "inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-sky-600 text-white shadow-xl shadow-sky-950/15 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:bg-sky-500 dark:hover:bg-sky-400 sm:h-auto sm:w-auto sm:px-5 sm:py-3 sm:text-sm sm:font-semibold";

function isDenseStudyRoute(pathname: string | null) {
  return Boolean(
    pathname &&
    /(^|\/)(analytics|dictionary|entry|grammar)(?:\/|$)/.test(pathname),
  );
}

function preloadFloatingAiAssistantPanel() {
  void import("./FloatingAiAssistantPanel");
}

function FloatingAiAssistantLoading() {
  const { t } = useLanguage();

  return (
    <div className={FLOATING_ASSISTANT_CONTAINER_CLASS}>
      <div
        className={FLOATING_ASSISTANT_BUTTON_CLASS}
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">
          {t("shenute.launcher.loading")}
        </span>
      </div>
    </div>
  );
}

const FloatingAiAssistantPanel = dynamic(
  () =>
    import("./FloatingAiAssistantPanel").then((module) => ({
      default: module.FloatingAiAssistantPanel,
    })),
  {
    ssr: false,
    loading: () => <FloatingAiAssistantLoading />,
  },
);

/**
 * Keeps the shared app frame light until the user explicitly opens Shenute AI.
 */
export function FloatingAiAssistant() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [hasOpened, setHasOpened] = useState(false);
  const launcherClassName = cx(
    FLOATING_ASSISTANT_CONTAINER_CLASS,
    isDenseStudyRoute(pathname) && "hidden sm:block",
  );
  const isShenuteRoute = Boolean(
    pathname && /(^|\/)shenute(?:\/|$)/.test(pathname),
  );

  useEffect(() => {
    if (isShenuteRoute) {
      return;
    }

    if (isDenseStudyRoute(pathname)) {
      return;
    }

    const preload = () => preloadFloatingAiAssistantPanel();
    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(preload, { timeout: 1800 })
        : undefined;
    const timeout = window.setTimeout(preload, 1200);

    return () => {
      window.clearTimeout(timeout);
      if (idleCallback !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallback);
      }
    };
  }, [isShenuteRoute, pathname]);

  if (isShenuteRoute) {
    return null;
  }

  if (hasOpened) {
    return <FloatingAiAssistantPanel initialOpen />;
  }

  return (
    <div className={launcherClassName}>
      <button
        type="button"
        aria-label={t("shenute.launcher.open")}
        title={t("shenute.launcher.open")}
        onClick={() => {
          setHasOpened(true);
        }}
        onPointerDown={preloadFloatingAiAssistantPanel}
        onFocus={() => {
          preloadFloatingAiAssistantPanel();
        }}
        onMouseEnter={() => {
          preloadFloatingAiAssistantPanel();
        }}
        className={FLOATING_ASSISTANT_BUTTON_CLASS}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">
          {t("shenute.launcher.open")}
        </span>
      </button>
    </div>
  );
}
