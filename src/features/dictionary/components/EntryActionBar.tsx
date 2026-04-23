"use client";

import { Flag, Heart, Share2 } from "lucide-react";
import { useCallback, useState, type ComponentType } from "react";

import { AuthGatedActionButton } from "@/components/AuthGatedActionButton";
import { useLanguage } from "@/components/LanguageProvider";
import type { LexicalEntry } from "@/features/dictionary/types";
import { cx } from "@/lib/classes";

type EntryActionIntent = "favorite" | "report" | "share";

type EntryActionBarProps = {
  entry: LexicalEntry;
  parentEntry?: LexicalEntry | null;
  relatedEntries?: readonly LexicalEntry[];
};

type EntryActionBarPanelProps = EntryActionBarProps & {
  initialIntent?: EntryActionIntent;
};

type EntryActionBarPanelComponent = ComponentType<EntryActionBarPanelProps>;

export function EntryActionBar(props: EntryActionBarProps) {
  const { t } = useLanguage();
  const [Panel, setPanel] = useState<EntryActionBarPanelComponent | null>(null);
  const [initialIntent, setInitialIntent] = useState<
    EntryActionIntent | undefined
  >();
  const lockedMessage = t("entry.actions.loginPrompt");

  const loadPanel = useCallback(
    (intent?: EntryActionIntent) => {
      if (intent) {
        setInitialIntent(intent);
      }

      if (Panel) {
        return;
      }

      void import("./EntryActionBarPanel").then((module) => {
        setPanel(() => module.EntryActionBarPanel);
      });
    },
    [Panel],
  );

  if (Panel) {
    return <Panel {...props} initialIntent={initialIntent} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            {t("entry.actions.eyebrow")}
          </p>
          <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
            {t("entry.actions.description")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary gap-2 px-4"
            onClick={() => loadPanel("share")}
            onFocus={() => loadPanel()}
            onMouseEnter={() => loadPanel()}
          >
            <Share2 className="h-4 w-4" />
            {t("entry.actions.share")}
          </button>

          <span
            onFocusCapture={() => loadPanel()}
            onMouseEnter={() => loadPanel()}
            onPointerDownCapture={() => loadPanel("favorite")}
          >
            <AuthGatedActionButton
              className={cx("btn-secondary gap-2 px-4")}
              isAuthenticated={false}
              isReady
              lockedMessage={lockedMessage}
            >
              <Heart className="h-4 w-4" />
              {t("entry.actions.favorite")}
            </AuthGatedActionButton>
          </span>

          <span
            onFocusCapture={() => loadPanel()}
            onMouseEnter={() => loadPanel()}
            onPointerDownCapture={() => loadPanel("report")}
          >
            <AuthGatedActionButton
              className={cx("btn-secondary gap-2 px-4")}
              isAuthenticated={false}
              isReady
              lockedMessage={lockedMessage}
            >
              <Flag className="h-4 w-4" />
              {t("entry.actions.report")}
            </AuthGatedActionButton>
          </span>
        </div>
      </div>
    </div>
  );
}
