import { permanentRedirect } from "next/navigation";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";

export default async function LegacyGrammarLessonRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(getGrammarLessonPath(slug, "en"));
}
