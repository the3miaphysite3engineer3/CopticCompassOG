import type { ReactNode } from "react";
import { Badge } from "@/components/Badge";
import type { GrammarLessonBundle } from "@/content/grammar/schema";
import { cx } from "@/lib/classes";
import type { Language } from "@/types/i18n";
import {
  getGrammarConceptAnchorId,
  getGrammarSourceAnchorId,
  getOrderedLessonConcepts,
  getOrderedLessonSources,
} from "@/features/grammar/lib/grammarPresentation";
import { getPublicationPath } from "@/features/publications/lib/publications";
import { GrammarBlockRenderer } from "@/features/grammar/renderers/GrammarBlockRenderer";

type GrammarLessonSemanticsProps = {
  lessonBundle: GrammarLessonBundle;
  language: Language;
  className?: string;
};

function getConceptRelations(
  lessonBundle: GrammarLessonBundle,
  relatedConceptIds: readonly string[],
) {
  const conceptMap = new Map(
    lessonBundle.concepts.map((concept) => [concept.id, concept] as const),
  );

  return relatedConceptIds
    .map((conceptId) => conceptMap.get(conceptId))
    .filter((concept): concept is GrammarLessonBundle["concepts"][number] => concept !== undefined);
}

function SemanticPanel({
  title,
  eyebrow,
  count,
  className,
  children,
}: {
  title: string;
  eyebrow: string;
  count?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-2xl border border-stone-200/90 bg-white/70 shadow-sm backdrop-blur-sm dark:border-stone-800/90 dark:bg-stone-950/40",
        className,
      )}
    >
      <div className="border-b border-stone-200/80 px-5 py-4 dark:border-stone-800/80">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {eyebrow}
        </p>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h2>
          {typeof count === "number" ? (
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
              {String(count).padStart(2, "0")}
            </span>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function GrammarLessonConceptSummary({
  lessonBundle,
  language,
  className,
}: GrammarLessonSemanticsProps) {
  const concepts = getOrderedLessonConcepts(lessonBundle);

  if (concepts.length === 0) {
    return null;
  }

  return (
    <SemanticPanel
      className={className}
      eyebrow={language === "en" ? "Glossary" : "Begrippen"}
      title={language === "en" ? "Key concepts" : "Kernbegrippen"}
      count={concepts.length}
    >
      <div className="flex flex-wrap gap-2">
        {concepts.map((concept) => (
          <a
            key={concept.id}
            href={`#${getGrammarConceptAnchorId(concept.id)}`}
            className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/60 dark:hover:text-sky-200"
          >
            {concept.title[language]}
          </a>
        ))}
      </div>
    </SemanticPanel>
  );
}

export function GrammarLessonConceptGlossary({
  lessonBundle,
  language,
  className,
}: GrammarLessonSemanticsProps) {
  const concepts = getOrderedLessonConcepts(lessonBundle);

  if (concepts.length === 0) {
    return null;
  }

  return (
    <SemanticPanel
      className={className}
      eyebrow={language === "en" ? "Glossary" : "Begrippen"}
      title={language === "en" ? "Concept glossary" : "Begrippenlijst"}
      count={concepts.length}
    >
      <div className="space-y-5">
        {concepts.map((concept) => {
          const visibleTags = concept.tags
            .filter((tag) => !tag.startsWith("lesson-"))
            .slice(0, 2);
          const relatedConcepts = getConceptRelations(
            lessonBundle,
            concept.relatedConceptRefs,
          );

          return (
            <article
              key={concept.id}
              id={getGrammarConceptAnchorId(concept.id)}
              className="scroll-mt-28 rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-4 dark:border-stone-800/80 dark:bg-stone-950/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {concept.title[language]}
                </h3>
                {visibleTags.map((tag) => (
                  <Badge key={tag} tone="neutral" size="xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <GrammarBlockRenderer
                blocks={concept.definition[language]}
                language={language}
                lessonBundle={lessonBundle}
                className="mt-3"
              />

              {relatedConcepts.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                    {language === "en" ? "Related concepts" : "Verwante begrippen"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {relatedConcepts.map((relatedConcept) => (
                      <a
                        key={relatedConcept.id}
                        href={`#${getGrammarConceptAnchorId(relatedConcept.id)}`}
                        className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-sky-200 hover:text-sky-700 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300 dark:hover:border-sky-900/70 dark:hover:text-sky-300"
                      >
                        {relatedConcept.title[language]}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </SemanticPanel>
  );
}

export function GrammarLessonBibliography({
  lessonBundle,
  language,
  className,
}: GrammarLessonSemanticsProps) {
  const sources = getOrderedLessonSources(lessonBundle);
  const rightsStatement = lessonBundle.lesson.rights?.statement[language];

  if (sources.length === 0 && !rightsStatement) {
    return null;
  }

  return (
    <SemanticPanel
      className={className}
      eyebrow={language === "en" ? "Bibliography" : "Bibliografie"}
      title={language === "en" ? "Sources" : "Bronnen"}
      count={sources.length > 0 ? sources.length : undefined}
    >
      {rightsStatement ? (
        <p className="mb-4 text-sm leading-7 text-stone-600 dark:text-stone-300">
          {rightsStatement}
        </p>
      ) : null}

      {sources.length > 0 ? (
        <ol className="space-y-4">
          {sources.map((source) => {
            const sourceHref = source.publicationId
              ? getPublicationPath(source.publicationId, language)
              : source.url;

            return (
              <li
                key={source.id}
                id={getGrammarSourceAnchorId(source.id)}
                className="scroll-mt-28 rounded-xl border border-stone-200/80 bg-stone-50/70 px-4 py-4 dark:border-stone-800/80 dark:bg-stone-950/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {sourceHref ? (
                      <a
                        href={sourceHref}
                        className="text-base font-semibold text-sky-700 underline underline-offset-4 transition-colors hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
                      >
                        {source.title}
                      </a>
                    ) : (
                      <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
                        {source.title}
                      </p>
                    )}
                    {source.subtitle ? (
                      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        {source.subtitle}
                      </p>
                    ) : null}
                    {source.author || source.year ? (
                      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                        {[source.author, source.year].filter(Boolean).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  {source.comingSoon ? (
                    <Badge tone="surface" size="xs">
                      {language === "en" ? "Coming soon" : "Binnenkort"}
                    </Badge>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </SemanticPanel>
  );
}
