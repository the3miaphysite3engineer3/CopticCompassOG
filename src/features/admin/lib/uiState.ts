"use client";

import { useSyncExternalStore } from "react";

const ADMIN_UI_STORAGE_EVENT = "admin-ui-storage";

/**
 * Reads a persisted admin UI value from localStorage and degrades to `null`
 * when storage is unavailable.
 */
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

/**
 * Broadcasts a same-tab storage update event so multiple admin panels can stay
 * in sync without waiting for the browser `storage` event.
 */
function dispatchStorageUpdate(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ADMIN_UI_STORAGE_EVENT, { detail: key }),
  );
}

/**
 * Subscribes to both browser storage events and same-tab custom updates for a
 * persisted admin UI key.
 */
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
  window.addEventListener(ADMIN_UI_STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ADMIN_UI_STORAGE_EVENT, handleStorage);
  };
}

/**
 * Persists admin UI state to localStorage and ignores write failures so the UI
 * still works in restricted browsing modes.
 */
function setStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
    dispatchStorageUpdate(key);
  } catch {
    return;
  }
}

/**
 * Persists a boolean disclosure state in localStorage and keeps it synchronized
 * across tabs and admin panels.
 */
export function usePersistentDisclosureState(
  key: string,
  defaultValue: boolean,
) {
  const state = useSyncExternalStore(
    (callback) => subscribeToStoredValue(key, callback),
    () => {
      const storedValue = getStoredValue(key);
      if (storedValue === null) {
        return defaultValue;
      }

      return storedValue === "open";
    },
    () => defaultValue,
  );

  return [
    state,
    (nextValue: boolean) => setStoredValue(key, nextValue ? "open" : "closed"),
  ] as const;
}

/**
 * Persists a constrained filter value in localStorage and ignores unsupported
 * writes.
 */
export function usePersistentFilterState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[],
) {
  const value = useSyncExternalStore(
    (callback) => subscribeToStoredValue(key, callback),
    () => {
      const storedValue = getStoredValue(key);
      return storedValue && allowedValues.includes(storedValue as T)
        ? (storedValue as T)
        : defaultValue;
    },
    () => defaultValue,
  );

  return [
    value,
    (nextValue: T) => {
      if (!allowedValues.includes(nextValue)) {
        return;
      }

      setStoredValue(key, nextValue);
    },
  ] as const;
}

/**
 * Persists an enum-like UI value in localStorage while validating it against
 * the allowed values list.
 */
export function usePersistentEnumState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[],
) {
  const value = useSyncExternalStore(
    (callback) => subscribeToStoredValue(key, callback),
    () => {
      const storedValue = getStoredValue(key);
      return storedValue && allowedValues.includes(storedValue as T)
        ? (storedValue as T)
        : defaultValue;
    },
    () => defaultValue,
  );

  return [
    value,
    (nextValue: T) => {
      if (!allowedValues.includes(nextValue)) {
        return;
      }

      setStoredValue(key, nextValue);
    },
  ] as const;
}
