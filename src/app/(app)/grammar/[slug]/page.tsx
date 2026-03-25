import { redirect } from "next/navigation";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export default async function LegacyGrammarLessonRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const preferredLanguage = await getPreferredLanguage();
  redirect(getGrammarLessonPath(slug, preferredLanguage));
}
