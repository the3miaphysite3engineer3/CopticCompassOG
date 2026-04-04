"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { Button } from "@/components/Button";
import type {
  GrammarLessonBundle,
  GrammarSectionDocument,
} from "@/content/grammar/schema";
import { useLanguage } from "@/components/LanguageProvider";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import { cx } from "@/lib/classes";
import {
  type GrammarAdjacentLessonLink,
  GrammarLessonBottomNavigation,
  GrammarLessonLearnerPanel,
  GrammarLessonNavigationPanel,
  GrammarLessonNotesPanel,
  GrammarLessonSectionProgressButton,
} from "@/features/grammar/components/GrammarLessonLearnerPanel";
import { GrammarLessonOutline } from "@/features/grammar/components/GrammarLessonPrimitives";
import { GrammarLessonRenderProvider } from "@/features/grammar/components/GrammarLessonRenderContext";
import { GrammarLessonConceptSummary } from "@/features/grammar/components/GrammarLessonSemantics";
import { getGrammarLessonAbbreviationSectionId } from "@/features/grammar/lib/grammarPresentation";
import {
  useActiveLessonSectionId,
  usePersistentLessonRailState,
  usePersistentLessonWorkspaceMode,
} from "@/features/grammar/lib/lessonWorkspaceState";
import { getGrammarPath, getLocalizedHomePath } from "@/lib/locale";
import { useGrammarLessonLearnerState } from "@/features/grammar/lib/useGrammarLessonLearnerState";
import { GrammarLessonDocumentRenderer } from "@/features/grammar/renderers/GrammarLessonDocumentRenderer";

type GrammarLessonPageClientProps = {
  lessonBundle: GrammarLessonBundle;
  nextLesson: GrammarAdjacentLessonLink | null;
  previousLesson: GrammarAdjacentLessonLink | null;
};

type LessonRailSide = "left" | "right";

function getOrderedSections(
  lessonBundle: GrammarLessonBundle,
): GrammarSectionDocument[] {
  const sectionsById = new Map(
    lessonBundle.lesson.sections.map(
      (section) => [section.id, section] as const,
    ),
  );

  return lessonBundle.lesson.sectionOrder
    .map((sectionId) => sectionsById.get(sectionId))
    .filter(
      (section): section is GrammarSectionDocument => section !== undefined,
    );
}

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
  expandLabel,
  collapseLabel,
  onToggle,
  side,
}: {
  collapsed: boolean;
  expandLabel: string;
  collapseLabel: string;
  onToggle: () => void;
  side: LessonRailSide;
}) {
  const Icon = collapsed
    ? side === "left"
      ? PanelLeftOpen
      : PanelRightOpen
    : side === "left"
      ? PanelLeftClose
      : PanelRightClose;

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

export function GrammarLessonPageClient({
  lessonBundle,
  nextLesson,
  previousLesson,
}: GrammarLessonPageClientProps) {
  const { language, t } = useLanguage();
  const [renderMode, setRenderMode] = useState<"web" | "pdf">("web");
  const lesson = lessonBundle.lesson;
  const orderedSections = getOrderedSections(lessonBundle);
  const lessonContentId = `${lesson.id}-pdf-content`;
  const lessonOutlineEyebrow =
    language === "en" ? "Lesson map" : "Lesoverzicht";
  const lessonOutlineTitle =
    language === "en" ? "On this page" : "Op deze pagina";
  const lessonAbbreviationAppendixTitle =
    language === "en"
      ? "Abbreviations and symbols used in this lesson"
      : "Afkortingen en symbolen in deze les";
  const lessonRenderSessionKey = `${lesson.id}:${language}:${renderMode}`;
  const lessonDescription =
    lesson.description?.[language] ?? lesson.summary[language];
  const learnerState = useGrammarLessonLearnerState(lessonBundle);
  const hasSemanticSidebar =
    (renderMode === "web" && learnerState.status !== "unavailable") ||
    lessonBundle.concepts.length > 0;
  const lessonOutlineSections = useMemo(
    () => [
      ...orderedSections.map((section) => ({
        id: section.id,
        title: section.title[language],
      })),
      {
        id: getGrammarLessonAbbreviationSectionId(lesson.id),
        title: lessonAbbreviationAppendixTitle,
      },
    ],
    [language, lesson.id, lessonAbbreviationAppendixTitle, orderedSections],
  );
  const lessonOutlineSectionIds = useMemo(
    () => lessonOutlineSections.map((section) => section.id),
    [lessonOutlineSections],
  );
  const [canUseStudyMode, setCanUseStudyMode] = useState(false);
  const [workspaceMode, setWorkspaceMode] = usePersistentLessonWorkspaceMode(
    lesson.id,
  );
  const isInteractiveLessonView = renderMode === "web";
  const isStudyMode =
    isInteractiveLessonView && hasSemanticSidebar && workspaceMode === "study";
  const isStudyLayoutActive = isStudyMode && canUseStudyMode;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 96rem)");
    const syncMediaQuery = () => {
      setCanUseStudyMode(mediaQuery.matches);
    };

    syncMediaQuery();
    mediaQuery.addEventListener("change", syncMediaQuery);

    return () => {
      mediaQuery.removeEventListener("change", syncMediaQuery);
    };
  }, []);

  const activeSectionId = useActiveLessonSectionId(lessonOutlineSectionIds);
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] =
    usePersistentLessonRailState(lesson.id, "left", false);
  const [isRightRailCollapsed, setIsRightRailCollapsed] =
    usePersistentLessonRailState(lesson.id, "right", false);
  const leftRailCollapsed = isStudyLayoutActive && isLeftRailCollapsed;
  const rightRailCollapsed = isStudyLayoutActive && isRightRailCollapsed;
  const studyGridClassName = getStudyWorkspaceGridClass({
    hasSemanticSidebar,
    isLeftRailCollapsed: leftRailCollapsed,
    isRightRailCollapsed: rightRailCollapsed,
  });
  const leftRailLabels =
    language === "en"
      ? {
          expand: "Expand lesson map",
          collapse: "Collapse lesson map",
          compact: "Map",
        }
      : {
          expand: "Lesoverzicht uitklappen",
          collapse: "Lesoverzicht inklappen",
          compact: "Les",
        };
  const rightRailLabels =
    language === "en"
      ? {
          expand: "Expand study tools",
          collapse: "Collapse study tools",
          compact: "Study",
        }
      : {
          expand: "Studiehulp uitklappen",
          collapse: "Studiehulp inklappen",
          compact: "Studie",
        };
  const studyModeLabels =
    language === "en"
      ? {
          enter: "Study mode",
          exit: "Reading layout",
        }
      : {
          enter: "Studiemodus",
          exit: "Leesweergave",
        };
  const lessonDocument = (
    <GrammarLessonDocumentRenderer
      lessonBundle={lessonBundle}
      language={language}
      renderSectionFooter={
        learnerState.sectionCompletionEnabled
          ? (section) => (
              <div className="flex justify-end">
                <GrammarLessonSectionProgressButton
                  isCompleted={learnerState.completedSectionIds.includes(
                    section.id,
                  )}
                  isPending={learnerState.pendingSectionId === section.id}
                  language={language}
                  onToggle={() => learnerState.toggleSectionComplete(section)}
                />
              </div>
            )
          : undefined
      }
    />
  );
  const lessonNotes =
    renderMode === "web" ? (
      <GrammarLessonNotesPanel
        errorMessage={learnerState.errorMessage}
        hasUnsavedNoteChanges={learnerState.hasUnsavedNoteChanges}
        isNotePending={learnerState.isNotePending}
        language={language}
        noteText={learnerState.noteText}
        noteUpdatedAt={learnerState.noteUpdatedAt}
        onSaveNote={learnerState.saveNote}
        onNoteChange={learnerState.setNoteText}
        status={learnerState.status}
      />
    ) : null;
  const lessonBottomNavigation =
    renderMode === "web" ? (
      <GrammarLessonBottomNavigation
        language={language}
        nextLesson={nextLesson}
        previousLesson={previousLesson}
      />
    ) : null;

  return (
    <PageShell
      className="min-h-screen overflow-visible px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10"
      contentClassName="w-full space-y-0 pt-10"
      width="standard"
      accents={[
        pageShellAccents.topRightSkyOrb,
        pageShellAccents.bottomLeftEmeraldOrbSoft,
      ]}
    >
      <div className="mb-8 space-y-4">
        <BreadcrumbTrail
          items={[
            { label: t("nav.home"), href: getLocalizedHomePath(language) },
            { label: t("nav.grammar"), href: getGrammarPath(language) },
            { label: lesson.title[language] },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={getGrammarPath(language)}
            className="btn-secondary gap-2 px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("grammar.back")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            {isInteractiveLessonView &&
            hasSemanticSidebar &&
            canUseStudyMode ? (
              <Button
                type="button"
                variant={isStudyMode ? "primary" : "secondary"}
                className="hidden 2xl:inline-flex"
                onClick={() =>
                  setWorkspaceMode(isStudyMode ? "reading" : "study")
                }
              >
                {isStudyMode ? studyModeLabels.exit : studyModeLabels.enter}
              </Button>
            ) : null}
            <DownloadPdfButton
              targetId={lessonContentId}
              fileName={`Coptic_${lesson.title.en.replace(/\s+/g, "_")}.pdf`}
              beforeCapture={() => {
                flushSync(() => {
                  setRenderMode("pdf");
                });
              }}
              afterCapture={() => {
                flushSync(() => {
                  setRenderMode("web");
                });
              }}
            />
          </div>
        </div>
      </div>

      <div id={lesson.id} className="bg-transparent pb-4 dark:bg-transparent">
        <GrammarLessonRenderProvider
          renderMode={renderMode}
          sessionKey={lessonRenderSessionKey}
        >
          <div id={lessonContentId}>
            <PageHeader
              eyebrow={t("grammar.lessonBadge")}
              eyebrowVariant="badge"
              title={`${t("nav.grammar")} - ${lesson.title[language]}`}
              description={lessonDescription}
              tone="sky"
              size="compact"
              className="mb-10"
            />

            {isStudyLayoutActive ? (
              <div className="relative hidden 2xl:block">
                <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-6 3xl:px-8">
                  <div
                    className={cx("grid items-start gap-6", studyGridClassName)}
                  >
                    <div className="app-sticky-panel self-start">
                      <div className="flex flex-col gap-2">
                        {leftRailCollapsed ? (
                          <CollapsedRailCard
                            collapsedLabel={leftRailLabels.compact}
                            expandLabel={leftRailLabels.expand}
                            onToggle={() => setIsLeftRailCollapsed(false)}
                            side="left"
                          />
                        ) : (
                          <>
                            <div className="flex justify-end">
                              <DesktopRailToggle
                                collapsed={false}
                                expandLabel={leftRailLabels.expand}
                                collapseLabel={leftRailLabels.collapse}
                                onToggle={() => setIsLeftRailCollapsed(true)}
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
                          {rightRailCollapsed ? (
                            <CollapsedRailCard
                              collapsedLabel={rightRailLabels.compact}
                              expandLabel={rightRailLabels.expand}
                              onToggle={() => setIsRightRailCollapsed(false)}
                              side="right"
                            />
                          ) : (
                            <>
                              <div className="flex justify-end">
                                <DesktopRailToggle
                                  collapsed={false}
                                  expandLabel={rightRailLabels.expand}
                                  collapseLabel={rightRailLabels.collapse}
                                  onToggle={() => setIsRightRailCollapsed(true)}
                                  side="right"
                                />
                              </div>
                              <div className="max-h-[calc(100vh-var(--app-sticky-offset)-4rem)] space-y-4 overflow-y-auto pr-1">
                                {renderMode === "web" ? (
                                  <GrammarLessonLearnerPanel
                                    errorMessage={learnerState.errorMessage}
                                    isBookmarkPending={
                                      learnerState.isBookmarkPending
                                    }
                                    language={language}
                                    onToggleBookmark={
                                      learnerState.toggleBookmark
                                    }
                                    status={learnerState.status}
                                    summary={learnerState.summary}
                                  />
                                ) : null}
                                {renderMode === "web" ? (
                                  <GrammarLessonNavigationPanel
                                    language={language}
                                    nextLesson={nextLesson}
                                    previousLesson={previousLesson}
                                  />
                                ) : null}
                                <GrammarLessonConceptSummary
                                  lessonBundle={lessonBundle}
                                  language={language}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className={cx(isStudyLayoutActive && "2xl:hidden")}>
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
                      {renderMode === "web" ? (
                        <GrammarLessonLearnerPanel
                          errorMessage={learnerState.errorMessage}
                          isBookmarkPending={learnerState.isBookmarkPending}
                          language={language}
                          onToggleBookmark={learnerState.toggleBookmark}
                          status={learnerState.status}
                          summary={learnerState.summary}
                        />
                      ) : null}
                      <GrammarLessonConceptSummary
                        lessonBundle={lessonBundle}
                        language={language}
                      />
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
          </div>
        </GrammarLessonRenderProvider>
      </div>
    </PageShell>
  );
}
