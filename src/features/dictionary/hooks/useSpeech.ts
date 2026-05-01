import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

import { getPremiumAudio } from "@/actions/tts";
import { useTtsSettings } from "@/features/dictionary/hooks/useTtsSettings";
import { bohairicToPhonetic } from "@/features/dictionary/lib/bohairicPhonetics";
import { copticToIPA, VOICES } from "@/features/dictionary/lib/copticTts";

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
  speakPremium: (copticText: string) => Promise<void>;
  speakAuto: (copticText: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  isPremiumLoading: boolean;
}

/**
 * Exposes a shared Web Speech controller for Bohairic dictionary
 * pronunciations.
 */
export function useSpeech(): UseSpeechReturn {
  const speechId = useId();
  const [activeId, setActiveId] = useState<string | null>(activeSpeechId);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [premiumAudio, setPremiumAudio] = useState<HTMLAudioElement | null>(
    null,
  );
  const { settings } = useTtsSettings();

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

  const speakPremium = useCallback(
    async (copticText: string) => {
      if (!copticText.trim()) {
        return;
      }

      try {
        setIsPremiumLoading(true);
        publishActiveSpeechId(null);
        window.speechSynthesis.cancel();
        if (premiumAudio) {
          premiumAudio.pause();
          setPremiumAudio(null);
        }

        const voice = VOICES[settings.voice];
        const ipa = copticToIPA(copticText, voice.dialect);
        const { base64Audio, mimeType } = await getPremiumAudio(ipa, voice.id);

        const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
        setPremiumAudio(audio);

        audio.onplay = () => publishActiveSpeechId(speechId);
        audio.onended = () => {
          clearActiveSpeechId(speechId);
          setPremiumAudio(null);
        };
        audio.onerror = () => {
          clearActiveSpeechId(speechId);
          setPremiumAudio(null);
        };

        await audio.play();
      } catch (error) {
        console.warn("[useSpeech] Premium speech synthesis failed:", error);
        clearActiveSpeechId(speechId);
        throw error;
      } finally {
        setIsPremiumLoading(false);
      }
    },
    [speechId, premiumAudio, settings.voice],
  );

  const speakAuto = useCallback(
    (copticText: string) => {
      if (settings.mode === "premium") {
        speakPremium(copticText).catch(() => {
          // Fallback to standard if premium fails
          speak(copticText);
        });
      } else {
        speak(copticText);
      }
    },
    [settings.mode, speakPremium, speak],
  );

  const stop = useCallback(() => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    if (premiumAudio) {
      premiumAudio.pause();
      setPremiumAudio(null);
    }
    clearActiveSpeechId(speechId);
  }, [speechId, premiumAudio]);

  return {
    speak,
    speakPremium,
    speakAuto,
    stop,
    isSpeaking: activeId === speechId,
    isSupported,
    isPremiumLoading,
  };
}
