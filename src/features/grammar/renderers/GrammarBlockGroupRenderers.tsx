"use client";

import type { GrammarLessonBundle } from "@/content/grammar/schema";
import { ExerciseForm } from "@/features/grammar/components/ExerciseForm";
import { GrammarLessonCard } from "@/features/grammar/components/GrammarLessonPrimitives";
import { getEntryPath } from "@/lib/locale";
import type { Language } from "@/types/i18n";
import type { GrammarBlockRenderHelperProps } from "./grammarBlockRendererShared";

type GrammarExerciseGroupBlockProps = GrammarBlockRenderHelperProps & {
  exerciseIds: readonly string[];
};

type GrammarExampleGroupBlockProps = GrammarBlockRenderHelperProps & {
  columns?: 1 | 2;
  exampleIds: readonly string[];
};

function renderExampleCopticText(text: string) {
  if (text.startsWith("Ø-")) {
    return (
      <>
        <sup className="text-sm font-semibold not-italic">Ø</sup>-
        {text.slice(2)}
      </>
    );
  }

  return text;
}

function renderDictionaryEntryHref(
  dictionaryEntryId: string,
  language: Language,
) {
  return getEntryPath(encodeURIComponent(dictionaryEntryId), language);
}

function renderExampleCopticSegments(
  coptic: string,
  dictionaryEntryId: string | undefined,
  index: number,
  language: Language,
) {
  const content = renderExampleCopticText(coptic);

  if (!dictionaryEntryId) {
    return <span key={`segment-${index}`}>{content}</span>;
  }

  return (
    <a
      key={`segment-${index}`}
      href={renderDictionaryEntryHref(dictionaryEntryId, language)}
      target="_blank"
      rel="noreferrer noopener"
      data-dictionary-entry-id={dictionaryEntryId}
      className="no-underline"
    >
      {content}
    </a>
  );
}

function getExerciseGroupItems(
  lessonBundle: GrammarLessonBundle | undefined,
  exerciseIds: readonly string[],
) {
  return (
    lessonBundle?.exercises.filter((exercise) =>
      exerciseIds.includes(exercise.id),
    ) ?? []
  );
}

function getExampleGroupItems(
  lessonBundle: GrammarLessonBundle | undefined,
  exampleIds: readonly string[],
) {
  return (
    lessonBundle?.examples.filter((example) =>
      exampleIds.includes(example.id),
    ) ?? []
  );
}

export function GrammarExerciseGroupBlock({
  exerciseIds,
  language,
  lessonBundle,
  renderBlocks,
}: GrammarExerciseGroupBlockProps) {
  const exercises = getExerciseGroupItems(lessonBundle, exerciseIds);

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <GrammarLessonCard
          key={exercise.id}
          tone="sky"
          className="space-y-4 p-5"
        >
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {exercise.title[language]}
            </h3>
            <div className="mt-2 text-sm leading-7 text-stone-700 dark:text-stone-300">
              {renderBlocks(exercise.prompt[language])}
            </div>
          </div>
          <ExerciseForm
            lessonSlug={lessonBundle?.lesson.slug ?? exercise.lessonId}
            exerciseId={exercise.id}
            language={language}
            questions={exercise.items.map((item) => ({
              id: item.id,
              prompt: item.prompt[language],
              minLength: item.answerSchema?.minLength,
              maxLength: item.answerSchema?.maxLength,
            }))}
          />
        </GrammarLessonCard>
      ))}
    </div>
  );
}

export function GrammarExampleGroupBlock({
  columns = 1,
  exampleIds,
  language,
  lessonBundle,
}: GrammarExampleGroupBlockProps) {
  const examples = getExampleGroupItems(lessonBundle, exampleIds);

  if (examples.length === 0) {
    return null;
  }

  const renderExampleList = (items: typeof examples) => (
    <ul className="space-y-3">
      {items.map((example) => (
        <li
          key={example.id}
          className="leading-7 text-stone-700 dark:text-stone-300"
        >
          <span className="font-coptic text-xl text-emerald-600 dark:text-emerald-400">
            {example.copticSegments && example.copticSegments.length > 0 ? (
              example.copticSegments.map((segment, segmentIndex) =>
                renderExampleCopticSegments(
                  segment.text,
                  segment.dictionaryEntryId,
                  segmentIndex,
                  language,
                ),
              )
            ) : example.dictionaryRefs.length === 1 &&
              !/\s/.test(example.coptic.trim()) ? (
              <a
                href={renderDictionaryEntryHref(
                  example.dictionaryRefs[0] ?? "",
                  language,
                )}
                target="_blank"
                rel="noreferrer noopener"
                data-dictionary-entry-id={example.dictionaryRefs[0]}
                className="no-underline"
              >
                {renderExampleCopticText(example.coptic)}
              </a>
            ) : (
              renderExampleCopticText(example.coptic)
            )}
          </span>
          <span className="ml-3">{example.translation[language]}</span>
        </li>
      ))}
    </ul>
  );

  if (columns === 2 && examples.length > 1) {
    const splitIndex = Math.ceil(examples.length / 2);
    const firstColumn = examples.slice(0, splitIndex);
    const secondColumn = examples.slice(splitIndex);

    return (
      <GrammarLessonCard className="space-y-3">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div>{renderExampleList(firstColumn)}</div>
          <div>{renderExampleList(secondColumn)}</div>
        </div>
      </GrammarLessonCard>
    );
  }

  return (
    <GrammarLessonCard className="space-y-3">
      {renderExampleList(examples)}
    </GrammarLessonCard>
  );
}
