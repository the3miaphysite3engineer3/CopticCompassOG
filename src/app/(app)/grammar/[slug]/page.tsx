import type { Metadata } from "next";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocaleWithParams } from "@/lib/publicLocaleRouting";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Grammar Lesson Redirect",
  description: "Redirects visitors to the localized grammar lesson route.",
});

export default async function LegacyGrammarLessonRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return redirectToPreferredLocaleWithParams(params, ({ slug }, locale) =>
    getGrammarLessonPath(slug, locale),
  );
}
