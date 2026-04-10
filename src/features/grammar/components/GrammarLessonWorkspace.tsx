"use client";

import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { Button } from "@/components/Button";
import { SurfacePanel } from "@/components/SurfacePanel";
import { GrammarLessonOutline } from "@/features/grammar/components/GrammarLessonPrimitives";
import { cx } from "@/lib/classes";

import type { ReactNode } from "react";

type LessonRailSide = "left" | "right";

type RailLabels = {
  collapse: string;
  compact: string;
  expand: string;
};

type StudyWorkspaceProps = {
  activeSectionId: string | null;
  conceptSummary: ReactNode;
  hasSemanticSidebar: boolean;
  isLeftRailCollapsed: boolean;
  isRightRailCollapsed: boolean;
  learnerPanel: ReactNode;
  leftRailLabels: RailLabels;
  lessonBottomNavigation: ReactNode;
  lessonDocument: ReactNode;
  lessonNotes: ReactNode;
  lessonOutlineEyebrow: string;
  lessonOutlineSections: Array<{
    id: string;
    title: string;
  }>;
  lessonOutlineTitle: string;
  navigationPanel: ReactNode;
  onLeftRailToggle: () => void;
  onRightRailToggle: () => void;
  rightRailLabels: RailLabels;
};

type ReadingWorkspaceProps = {
  activeSectionId: string | null;
  conceptSummary: ReactNode;
  hasSemanticSidebar: boolean;
  learnerPanel: ReactNode;
  lessonBottomNavigation: ReactNode;
  lessonDocument: ReactNode;
  lessonNotes: ReactNode;
  lessonOutlineEyebrow: string;
  lessonOutlineSections: Array<{
    id: string;
    title: string;
  }>;
  lessonOutlineTitle: string;
};

function getStudyWorkspaceGridClass({
  hasSemanticSidebar,
  isLeftRailCollapsed,
  isRightRailCollapsed,
}: {
  hasSemanticSidebar: boolean;
  isLeftRailCollapsed: boolean;
  isRightRailCollapsed: boolean;
}) {
  if (!hasSemanticSidebar) {
    return isLeftRailCollapsed
      ? "2xl:grid-cols-[3.75rem_minmax(0,1fr)]"
      : "2xl:grid-cols-[minmax(15rem,17rem)_minmax(0,1fr)]";
  }

  if (isLeftRailCollapsed && isRightRailCollapsed) {
    return "2xl:grid-cols-[3.75rem_minmax(0,1fr)_3.75rem]";
  }

  if (isLeftRailCollapsed) {
    return "2xl:grid-cols-[3.75rem_minmax(0,1fr)_minmax(18rem,20rem)]";
  }

  if (isRightRailCollapsed) {
    return "2xl:grid-cols-[minmax(15rem,17rem)_minmax(0,1fr)_3.75rem]";
  }

  return "2xl:grid-cols-[minmax(15rem,17rem)_minmax(0,1fr)_minmax(18rem,20rem)]";
}

function DesktopRailToggle({
  collapsed,
  collapseLabel,
  expandLabel,
  onToggle,
  side,
}: {
  collapsed: boolean;
  collapseLabel: string;
  expandLabel: string;
  onToggle: () => void;
  side: LessonRailSide;
}) {
  let Icon = side === "left" ? PanelLeftClose : PanelRightClose;

  if (collapsed) {
    Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onToggle}
      aria-label={collapsed ? expandLabel : collapseLabel}
      className="h-9 w-9 rounded-xl px-0"
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{collapsed ? expandLabel : collapseLabel}</span>
    </Button>
  );
}

function CollapsedRailCard({
  collapsedLabel,
  expandLabel,
  onToggle,
  side,
}: {
  collapsedLabel: string;
  expandLabel: string;
  onToggle: () => void;
  side: LessonRailSide;
}) {
  const Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;

  return (
    <SurfacePanel
      rounded="2xl"
      shadow="soft"
      variant="subtle"
      className="w-[3.75rem] p-2"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={expandLabel}
        className="flex w-full flex-col items-center gap-2 rounded-xl px-2 py-3 text-center text-stone-500 transition-colors hover:bg-stone-100/80 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:text-stone-400 dark:hover:bg-stone-800/70 dark:hover:text-sky-300"
      >
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {collapsedLabel}
        </span>
      </button>
    </SurfacePanel>
  );
}

export function GrammarLessonStudyWorkspace({
  activeSectionId,
  conceptSummary,
  hasSemanticSidebar,
  isLeftRailCollapsed,
  isRightRailCollapsed,
  learnerPanel,
  leftRailLabels,
  lessonBottomNavigation,
  lessonDocument,
  lessonNotes,
  lessonOutlineEyebrow,
  lessonOutlineSections,
  lessonOutlineTitle,
  navigationPanel,
  onLeftRailToggle,
  onRightRailToggle,
  rightRailLabels,
}: StudyWorkspaceProps) {
  const studyGridClassName = getStudyWorkspaceGridClass({
    hasSemanticSidebar,
    isLeftRailCollapsed,
    isRightRailCollapsed,
  });

  return (
    <div className="relative hidden 2xl:block">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-6 3xl:px-8">
        <div className={cx("grid items-start gap-6", studyGridClassName)}>
          <div className="app-sticky-panel self-start">
            <div className="flex flex-col gap-2">
              {isLeftRailCollapsed ? (
                <CollapsedRailCard
                  collapsedLabel={leftRailLabels.compact}
                  expandLabel={leftRailLabels.expand}
                  onToggle={onLeftRailToggle}
                  side="left"
                />
              ) : (
                <>
                  <div className="flex justify-end">
                    <DesktopRailToggle
                      collapsed={false}
                      expandLabel={leftRailLabels.expand}
                      collapseLabel={leftRailLabels.collapse}
                      onToggle={onLeftRailToggle}
                      side="left"
                    />
                  </div>
                  <div className="max-h-[calc(100vh-var(--app-sticky-offset)-4rem)] overflow-y-auto pr-1">
                    <GrammarLessonOutline
                      activeSectionId={activeSectionId}
                      eyebrow={lessonOutlineEyebrow}
                      title={lessonOutlineTitle}
                      sections={lessonOutlineSections}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <SurfacePanel
            rounded="3xl"
            variant="elevated"
            className="px-6 py-6 sm:px-8 md:px-10"
          >
            <div className="mx-auto w-full max-w-4xl space-y-6">
              {lessonDocument}
              {lessonBottomNavigation}
              {lessonNotes}
            </div>
          </SurfacePanel>

          {hasSemanticSidebar ? (
            <div className="app-sticky-panel self-start">
              <div className="flex flex-col gap-2">
                {isRightRailCollapsed ? (
                  <CollapsedRailCard
                    collapsedLabel={rightRailLabels.compact}
                    expandLabel={rightRailLabels.expand}
                    onToggle={onRightRailToggle}
                    side="right"
                  />
                ) : (
                  <>
                    <div className="flex justify-end">
                      <DesktopRailToggle
                        collapsed={false}
                        expandLabel={rightRailLabels.expand}
                        collapseLabel={rightRailLabels.collapse}
                        onToggle={onRightRailToggle}
                        side="right"
                      />
                    </div>
                    <div className="max-h-[calc(100vh-var(--app-sticky-offset)-4rem)] space-y-4 overflow-y-auto pr-1">
                      {learnerPanel}
                      {navigationPanel}
                      {conceptSummary}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GrammarLessonReadingWorkspace({
  activeSectionId,
  conceptSummary,
  hasSemanticSidebar,
  learnerPanel,
  lessonBottomNavigation,
  lessonDocument,
  lessonNotes,
  lessonOutlineEyebrow,
  lessonOutlineSections,
  lessonOutlineTitle,
}: ReadingWorkspaceProps) {
  return (
    <div>
      <SurfacePanel
        rounded="3xl"
        variant="elevated"
        className="p-4 transition-colors duration-300 sm:p-5 md:p-10"
      >
        {hasSemanticSidebar ? (
          <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,1fr)]">
            <GrammarLessonOutline
              activeSectionId={activeSectionId}
              eyebrow={lessonOutlineEyebrow}
              title={lessonOutlineTitle}
              sections={lessonOutlineSections}
            />
            <div className="space-y-4">
              {learnerPanel}
              {conceptSummary}
            </div>
          </div>
        ) : (
          <GrammarLessonOutline
            activeSectionId={activeSectionId}
            className="mb-8"
            eyebrow={lessonOutlineEyebrow}
            title={lessonOutlineTitle}
            sections={lessonOutlineSections}
          />
        )}

        {lessonDocument}
        {lessonBottomNavigation}
      </SurfacePanel>

      {lessonNotes ? <div className="mt-6">{lessonNotes}</div> : null}
    </div>
  );
}
