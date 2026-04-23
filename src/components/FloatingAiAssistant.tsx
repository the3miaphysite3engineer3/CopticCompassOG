"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";

const FloatingAiAssistantPanel = dynamic(
  () =>
    import("./FloatingAiAssistantPanel").then((module) => ({
      default: module.FloatingAiAssistantPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-5 right-5 z-50">
        <div className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          Loading Shenute AI...
        </div>
      </div>
    ),
  },
);

/**
 * Keeps the shared app frame light until the user explicitly opens Shenute AI.
 */
export function FloatingAiAssistant() {
  const pathname = usePathname();
  const [hasOpened, setHasOpened] = useState(false);
  const isShenuteRoute = Boolean(
    pathname && /(^|\/)shenute(?:\/|$)/.test(pathname),
  );

  if (isShenuteRoute) {
    return null;
  }

  if (hasOpened) {
    return <FloatingAiAssistantPanel initialOpen />;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        type="button"
        onClick={() => {
          setHasOpened(true);
        }}
        onFocus={() => {
          void import("./FloatingAiAssistantPanel");
        }}
        onMouseEnter={() => {
          void import("./FloatingAiAssistantPanel");
        }}
        className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-sky-700"
      >
        Open Shenute AI
      </button>
    </div>
  );
}
