import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import { createNoIndexMetadata } from "@/lib/metadata";
import { redirectToPreferredLocaleWithParams } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Grammar Lesson Redirect",
  description: "Redirects visitors to the localized grammar lesson route.",
});

/**
 * Redirects the legacy grammar-lesson route to the preferred localized
 * destination while preserving the lesson slug.
 */
export default async function LegacyGrammarLessonRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return redirectToPreferredLocaleWithParams(params, ({ slug }, locale) =>
    getGrammarLessonPath(slug, locale),
  );
}
