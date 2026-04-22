"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, type ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import type { AdminWorkspaceOverview } from "@/features/admin/lib/dashboardData";
import { usePersistentEnumState } from "@/features/admin/lib/uiState";
import {
  ADMIN_WORKSPACE_MODES,
  type AdminWorkspaceMode,
} from "@/features/admin/lib/workspaceMode";
import { cx } from "@/lib/classes";
import type { Language } from "@/types/i18n";

const workspaceModeShellCopy = {
  en: {
    badge: "Workspace Mode",
    description:
      "Switch between active review work, outbound communications, and system visibility without carrying the whole admin page with you.",
    labels: {
      communications: "Communications",
      review: "Review",
      system: "System",
    },
  },
  nl: {
    badge: "Werkruimtemodus",
    description:
      "Schakel tussen actieve beoordelingen, uitgaande communicatie en systeemoverzicht zonder de hele adminpagina mee te nemen.",
    labels: {
      communications: "Communicatie",
      review: "Beoordeling",
      system: "Systeem",
    },
  },
} as const satisfies Record<
  Language,
  {
    badge: string;
    description: string;
    labels: Record<AdminWorkspaceMode, string>;
  }
>;

function formatAdminCount(value: number, language: Language) {
  return value.toLocaleString(language === "nl" ? "nl-BE" : "en-US");
}

function formatCountLabel(
  value: number,
  singular: string,
  plural: string,
  language: Language,
) {
  return `${formatAdminCount(value, language)} ${
    value === 1 ? singular : plural
  }`;
}

function getModeSummaryCount(
  mode: AdminWorkspaceMode,
  overview: AdminWorkspaceOverview,
) {
  switch (mode) {
    case "review":
      return (
        overview.pendingSubmissionCount +
        overview.openContactMessageCount +
        overview.openEntryReportCount
      );
    case "communications":
      return overview.actionableReleaseCount + overview.audienceSyncErrorCount;
    case "system":
      return overview.failedNotificationCount;
    default:
      return 0;
  }
}

function getModeLabel(mode: AdminWorkspaceMode, language: Language) {
  return workspaceModeShellCopy[language].labels[mode];
}

function getModeDescription(
  mode: AdminWorkspaceMode,
  overview: AdminWorkspaceOverview,
  language: Language,
) {
  if (language === "nl") {
    switch (mode) {
      case "review":
        return [
          formatCountLabel(
            overview.pendingSubmissionCount,
            "inzending",
            "inzendingen",
            language,
          ),
          formatCountLabel(
            overview.openContactMessageCount,
            "inboxgesprek",
            "inboxgesprekken",
            language,
          ),
          formatCountLabel(
            overview.openEntryReportCount,
            "rapport",
            "rapporten",
            language,
          ),
        ].join(", ");
      case "communications":
        return [
          formatCountLabel(
            overview.actionableReleaseCount,
            "actieve release",
            "actieve releases",
            language,
          ),
          formatCountLabel(
            overview.audienceSyncErrorCount,
            "synchronisatieprobleem",
            "synchronisatieproblemen",
            language,
          ),
        ].join(", ");
      case "system":
        return `${formatCountLabel(
          overview.failedNotificationCount,
          "mislukte melding",
          "mislukte meldingen",
          language,
        )} te controleren`;
      default:
        return "";
    }
  }

  switch (mode) {
    case "review":
      return `${formatCountLabel(
        overview.pendingSubmissionCount,
        "submission",
        "submissions",
        language,
      )}, ${formatCountLabel(
        overview.openContactMessageCount,
        "inbox thread",
        "inbox threads",
        language,
      )}, ${formatCountLabel(
        overview.openEntryReportCount,
        "report",
        "reports",
        language,
      )}`;
    case "communications":
      return `${formatCountLabel(
        overview.actionableReleaseCount,
        "active release",
        "active releases",
        language,
      )}, ${formatCountLabel(
        overview.audienceSyncErrorCount,
        "sync issue",
        "sync issues",
        language,
      )}`;
    case "system":
      return `${formatCountLabel(
        overview.failedNotificationCount,
        "failed notification",
        "failed notifications",
        language,
      )} to inspect`;
    default:
      return "";
  }
}

export function AdminWorkspaceModeShell({
  children,
  mode,
  overview,
}: {
  children: ReactNode;
  mode: AdminWorkspaceMode;
  overview: AdminWorkspaceOverview;
}) {
  const { language } = useLanguage();
  const copy = workspaceModeShellCopy[language];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [persistedMode, setPersistedMode] =
    usePersistentEnumState<AdminWorkspaceMode>(
      "admin-workspace:mode",
      "review",
      ADMIN_WORKSPACE_MODES,
    );
  const hasExplicitMode = searchParams.get("mode") !== null;

  useEffect(() => {
    if (hasExplicitMode || persistedMode === mode) {
      return;
    }

    const nextParams = new URLSearchParams(searchParamsString);

    if (persistedMode === "review") {
      nextParams.delete("mode");
    } else {
      nextParams.set("mode", persistedMode);
    }

    const nextQuery = nextParams.toString();
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }, [
    hasExplicitMode,
    mode,
    pathname,
    persistedMode,
    router,
    searchParamsString,
  ]);

  function handleModeChange(nextMode: AdminWorkspaceMode) {
    if (nextMode === mode) {
      setPersistedMode(nextMode);
      return;
    }

    setPersistedMode(nextMode);

    const nextParams = new URLSearchParams(searchParamsString);
    if (nextMode === "review") {
      nextParams.delete("mode");
    } else {
      nextParams.set("mode", nextMode);
    }

    const nextQuery = nextParams.toString();
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="space-y-8">
      <nav className="app-sticky-panel rounded-[2rem] border border-stone-200/80 bg-white/90 p-4 shadow-lg backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/80 dark:shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="flat" size="xs" caps>
            {copy.badge}
          </Badge>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {copy.description}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {ADMIN_WORKSPACE_MODES.map((nextMode) => {
            const isActive = nextMode === mode;
            const summaryCount = getModeSummaryCount(nextMode, overview);

            return (
              <button
                key={nextMode}
                type="button"
                onClick={() => handleModeChange(nextMode)}
                className={cx(
                  "rounded-[1.5rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50",
                  isActive
                    ? "border-sky-200 bg-sky-50/90 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40"
                    : "border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-white dark:border-stone-800 dark:bg-stone-900/40 dark:hover:border-stone-700 dark:hover:bg-stone-900/70",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cx(
                      "text-base font-semibold",
                      isActive
                        ? "text-sky-900 dark:text-sky-100"
                        : "text-stone-900 dark:text-stone-100",
                    )}
                  >
                    {getModeLabel(nextMode, language)}
                  </span>
                  <Badge tone={isActive ? "accent" : "surface"} size="xs">
                    {summaryCount}
                  </Badge>
                </div>

                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
                  {getModeDescription(nextMode, overview, language)}
                </p>
              </button>
            );
          })}
        </div>
      </nav>

      {children}
    </div>
  );
}
