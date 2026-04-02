import type { ReactNode } from "react";
import type {
  GrammarBlock,
  GrammarLessonBundle,
} from "@/content/grammar/schema";
import type { Language } from "@/types/i18n";

export type RenderGrammarBlocks = (
  blocks: readonly GrammarBlock[],
  options?: {
    className?: string;
    inheritTextColor?: boolean;
  },
) => ReactNode;

export type GrammarBlockRenderHelperProps = {
  inheritTextColor: boolean;
  language: Language;
  lessonBundle?: GrammarLessonBundle;
  renderBlocks: RenderGrammarBlocks;
};

export type GrammarRenderMode = "web" | "pdf";
