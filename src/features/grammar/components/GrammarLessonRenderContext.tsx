"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type GrammarLessonRenderMode = "web" | "pdf";

type FootnoteEntry = {
  number: number;
  content: ReactNode;
};

type FootnoteRegistry = {
  items: FootnoteEntry[];
  sessionKey: string;
};

type GrammarLessonRenderContextValue = {
  footnotes: readonly FootnoteEntry[];
  registerFootnote: (entry: FootnoteEntry) => void;
  renderMode: GrammarLessonRenderMode;
};

const GrammarLessonRenderContext =
  createContext<GrammarLessonRenderContextValue | null>(null);

type GrammarLessonRenderProviderProps = {
  children: ReactNode;
  renderMode: GrammarLessonRenderMode;
  sessionKey: string;
};

export function GrammarLessonRenderProvider({
  children,
  renderMode,
  sessionKey,
}: GrammarLessonRenderProviderProps) {
  const [registry, setRegistry] = useState<FootnoteRegistry>({
    items: [],
    sessionKey,
  });

  const registerFootnote = useCallback(
    (entry: FootnoteEntry) => {
      setRegistry((current) => {
        const isNewSession = current.sessionKey !== sessionKey;
        const currentItems = isNewSession ? [] : current.items;

        if (currentItems.some((item) => item.number === entry.number)) {
          return isNewSession
            ? {
                items: currentItems,
                sessionKey,
              }
            : current;
        }

        return {
          items: [...currentItems, entry].sort(
            (left, right) => left.number - right.number,
          ),
          sessionKey,
        };
      });
    },
    [sessionKey],
  );

  return (
    <GrammarLessonRenderContext.Provider
      value={{
        footnotes: registry.sessionKey === sessionKey ? registry.items : [],
        registerFootnote,
        renderMode,
      }}
    >
      {children}
    </GrammarLessonRenderContext.Provider>
  );
}

export function useGrammarLessonRenderContext() {
  const context = useContext(GrammarLessonRenderContext);

  if (!context) {
    throw new Error(
      "useGrammarLessonRenderContext must be used within a GrammarLessonRenderProvider",
    );
  }

  return context;
}
