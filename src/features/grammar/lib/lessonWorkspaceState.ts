"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const GRAMMAR_WORKSPACE_STORAGE_EVENT = "grammar-workspace-storage";

function getStoredValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function dispatchStorageUpdate(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(GRAMMAR_WORKSPACE_STORAGE_EVENT, { detail: key }),
  );
}

function subscribeToStoredValue(key: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: Event) => {
    if (event instanceof StorageEvent) {
      if (event.key !== null && event.key !== key) {
        return;
      }
    }

    if (event instanceof CustomEvent && event.detail !== key) {
      return;
    }

    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(GRAMMAR_WORKSPACE_STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(GRAMMAR_WORKSPACE_STORAGE_EVENT, handleStorage);
  };
}

function setStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
    dispatchStorageUpdate(key);
  } catch {
    // Ignore storage write failures so the lesson view still works.
  }
}

function getLessonWorkspaceStorageKey(
  lessonId: string,
  rail: "left" | "right",
) {
  return `grammar-lesson:${lessonId}:${rail}-rail`;
}

function getLessonWorkspaceModeStorageKey(lessonId: string) {
  return `grammar-lesson:${lessonId}:workspace-mode`;
}

export function usePersistentLessonRailState(
  lessonId: string,
  rail: "left" | "right",
  defaultValue: boolean,
) {
  const key = getLessonWorkspaceStorageKey(lessonId, rail);
  const state = useSyncExternalStore(
    (callback) => subscribeToStoredValue(key, callback),
    () => {
      const storedValue = getStoredValue(key);
      if (storedValue === null) {
        return defaultValue;
      }

      return storedValue === "collapsed";
    },
    () => defaultValue,
  );

  return [
    state,
    (nextValue: boolean) =>
      setStoredValue(key, nextValue ? "collapsed" : "expanded"),
  ] as const;
}

export function usePersistentLessonWorkspaceMode(
  lessonId: string,
  defaultValue: "reading" | "study" = "reading",
) {
  const key = getLessonWorkspaceModeStorageKey(lessonId);
  const mode = useSyncExternalStore(
    (callback) => subscribeToStoredValue(key, callback),
    () => {
      const storedValue = getStoredValue(key);
      return storedValue === "study" || storedValue === "reading"
        ? storedValue
        : defaultValue;
    },
    () => defaultValue,
  );

  return [
    mode,
    (nextValue: "reading" | "study") => setStoredValue(key, nextValue),
  ] as const;
}

function resolveCssLengthToPx(value: string, fallback: number) {
  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  const numericValue = Number.parseFloat(trimmed);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  if (trimmed.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(
      window.getComputedStyle(document.documentElement).fontSize,
    );
    return numericValue * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
  }

  if (trimmed.endsWith("px")) {
    return numericValue;
  }

  return numericValue;
}

function getAnchorOffsetPx() {
  if (typeof window === "undefined") {
    return 140;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  return resolveCssLengthToPx(
    rootStyles.getPropertyValue("--app-anchor-offset"),
    128,
  );
}

export function useActiveLessonSectionId(
  sectionIds: readonly string[],
  scrollContainer: HTMLElement | null = null,
) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sectionIds[0] ?? null,
  );
  const sectionKey = sectionIds.join("::");

  useEffect(() => {
    if (typeof window === "undefined" || sectionIds.length === 0) {
      return;
    }

    let frame = 0;

    const updateActiveSection = () => {
      const threshold = scrollContainer
        ? scrollContainer.getBoundingClientRect().top + 24
        : getAnchorOffsetPx() + 24;
      let nextSectionId = sectionIds[0] ?? null;
      let closestUpcomingSection: { id: string; top: number } | null = null;

      for (const sectionId of sectionIds) {
        const sectionElement = document.getElementById(sectionId);

        if (!sectionElement) {
          continue;
        }

        const { top } = sectionElement.getBoundingClientRect();

        if (top <= threshold) {
          nextSectionId = sectionId;
          continue;
        }

        if (
          closestUpcomingSection === null ||
          top < closestUpcomingSection.top
        ) {
          closestUpcomingSection = { id: sectionId, top };
        }
      }

      if (nextSectionId === sectionIds[0] && closestUpcomingSection) {
        const firstSectionElement = document.getElementById(sectionIds[0]);

        if (
          firstSectionElement &&
          firstSectionElement.getBoundingClientRect().top > threshold
        ) {
          nextSectionId = closestUpcomingSection.id;
        }
      }

      setActiveSectionId((currentValue) =>
        currentValue === nextSectionId ? currentValue : nextSectionId,
      );
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    scheduleUpdate();

    const scrollTarget = scrollContainer ?? window;

    scrollTarget.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      scrollTarget.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, [scrollContainer, sectionIds, sectionKey]);

  return activeSectionId;
}
