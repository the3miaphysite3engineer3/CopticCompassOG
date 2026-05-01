import { useEffect, useState } from "react";

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

export function useTtsSettings() {
  const [settings, setSettings] = useState<TtsSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("[useTtsSettings] Failed to parse stored settings", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings: Partial<TtsSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("[useTtsSettings] Failed to save settings", e);
      }
      return updated;
    });
  };

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
