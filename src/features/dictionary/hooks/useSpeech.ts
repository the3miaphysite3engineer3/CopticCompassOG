import { useState, useCallback } from "react";

import { bohairicToPhonetic } from "@/features/dictionary/lib/bohairicPhonetics";

interface UseSpeechReturn {
  speak: (copticText: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * Hook for pronouncing Bohairic Coptic text via the browser Web Speech API.
 * Transliterates Bohairic Coptic script to phonetic Latin before speaking.
 */
export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check for browser support once — avoid SSR issues with typeof window
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (copticText: string) => {
      if (!isSupported || !copticText.trim()) {
        return;
      }

      try {
        const phonetic = bohairicToPhonetic(copticText);
        const utterance = new SpeechSynthesisUtterance(phonetic);

        // en-US is the most reliably available voice across browsers
        utterance.lang = "en-US";
        // Slightly slower than default for clarity
        utterance.rate = 0.85;
        // Moderate pitch — avoids robotic extremes
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Cancel any currently playing speech before starting new
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn("[useSpeech] Speech synthesis failed:", error);
        setIsSpeaking(false);
      }
    },
    [isSupported],
  );

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
