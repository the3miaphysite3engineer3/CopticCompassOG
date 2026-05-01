import { useCallback, useSyncExternalStore } from "react";

import type { VoiceKey } from "@/features/dictionary/lib/copticTts";

export type TtsMode = "standard" | "premium";

interface TtsSettings {
  mode: TtsMode;
  voice: VoiceKey;
}

const STORAGE_KEY = "coptic_compass_tts_settings";

const DEFAULT_SETTINGS: TtsSettings = {
  mode: "premium",
  voice: "salma",
};

let listeners: Array<() => void> = [];
let cachedSettings: TtsSettings | undefined;

function readSettings(): TtsSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedSettings = JSON.parse(stored) as TtsSettings;
      return cachedSettings;
    }
  } catch (e) {
    console.warn("[useTtsSettings] Failed to parse stored settings", e);
  }

  cachedSettings = DEFAULT_SETTINGS;
  return cachedSettings;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): TtsSettings {
  return readSettings();
}

function getServerSnapshot(): TtsSettings {
  return DEFAULT_SETTINGS;
}

export function useTtsSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const updateSettings = useCallback((newSettings: Partial<TtsSettings>) => {
    const current = readSettings();
    const updated = { ...current, ...newSettings };
    cachedSettings = updated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("[useTtsSettings] Failed to save settings", e);
    }
    listeners.forEach((l) => l());
  }, []);

  return {
    settings,
    updateSettings,
    isLoaded: true,
  };
}
