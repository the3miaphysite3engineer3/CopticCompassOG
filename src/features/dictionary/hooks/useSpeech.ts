import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

import { bohairicToPhonetic } from "@/features/dictionary/lib/bohairicPhonetics";

type ActiveSpeechListener = (speechId: string | null) => void;

let activeSpeechId: string | null = null;
const activeSpeechListeners = new Set<ActiveSpeechListener>();

function publishActiveSpeechId(speechId: string | null) {
  activeSpeechId = speechId;
  activeSpeechListeners.forEach((listener) => listener(speechId));
}

function clearActiveSpeechId(speechId: string) {
  if (activeSpeechId === speechId) {
    publishActiveSpeechId(null);
  }
}

function isSpeechSynthesisSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

function subscribeToSpeechSupport() {
  return () => {};
}

interface UseSpeechReturn {
  speak: (copticText: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * Exposes a shared Web Speech controller for Bohairic dictionary
 * pronunciations.
 */
export function useSpeech(): UseSpeechReturn {
  const speechId = useId();
  const [activeId, setActiveId] = useState<string | null>(activeSpeechId);
  const isSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    isSpeechSynthesisSupported,
    () => false,
  );

  useEffect(() => {
    const handleActiveSpeechChange = (nextSpeechId: string | null) => {
      setActiveId(nextSpeechId);
    };

    activeSpeechListeners.add(handleActiveSpeechChange);
    handleActiveSpeechChange(activeSpeechId);

    return () => {
      activeSpeechListeners.delete(handleActiveSpeechChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (activeSpeechId === speechId && isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
        clearActiveSpeechId(speechId);
      }
    };
  }, [speechId]);

  const speak = useCallback(
    (copticText: string) => {
      if (!isSpeechSynthesisSupported() || !copticText.trim()) {
        return;
      }

      try {
        const phonetic = bohairicToPhonetic(copticText);
        if (!phonetic) {
          return;
        }

        const utterance = new window.SpeechSynthesisUtterance(phonetic);

        utterance.lang = "en-US";
        utterance.rate = 0.85;
        utterance.pitch = 1.0;

        utterance.onstart = () => publishActiveSpeechId(speechId);
        utterance.onend = () => clearActiveSpeechId(speechId);
        utterance.onerror = () => clearActiveSpeechId(speechId);

        publishActiveSpeechId(null);
        window.speechSynthesis.cancel();
        publishActiveSpeechId(speechId);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn("[useSpeech] Speech synthesis failed:", error);
        clearActiveSpeechId(speechId);
      }
    },
    [speechId],
  );

  const stop = useCallback(() => {
    if (!isSpeechSynthesisSupported()) {
      return;
    }
    window.speechSynthesis.cancel();
    clearActiveSpeechId(speechId);
  }, [speechId]);

  return { speak, stop, isSpeaking: activeId === speechId, isSupported };
}
