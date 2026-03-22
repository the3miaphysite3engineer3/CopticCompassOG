import type { Metadata } from "next";
import GrammarHubPageClient from "@/features/grammar/components/GrammarHubPageClient";
import { listGrammarLessons } from "@/features/grammar/lib/grammarDataset";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Coptic Grammar",
  description:
    "Interactive Coptic grammar lessons and exercises for students learning the language through structured, accessible study material.",
  path: "/grammar",
});

export default function GrammarPage() {
  const lessons = listGrammarLessons();

  return <GrammarHubPageClient lessons={lessons} />;
}
