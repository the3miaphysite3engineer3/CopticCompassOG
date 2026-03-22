"use client";

import type { GrammarBlock, GrammarLessonBundle } from "@/content/grammar/schema";
import type { Language } from "@/types/i18n";
import { cx } from "@/lib/classes";
import {
  GrammarLessonCard,
  GrammarLessonTable,
} from "@/features/grammar/components/GrammarLessonPrimitives";
import { ExerciseForm } from "@/features/grammar/components/ExerciseForm";
import { Footnote } from "@/features/grammar/components/Footnote";
import { GrammarInlineRenderer } from "./GrammarInlineRenderer";

type GrammarBlockRendererProps = {
  blocks: readonly GrammarBlock[];
  language: Language;
  lessonBundle?: GrammarLessonBundle;
  className?: string;
  inheritTextColor?: boolean;
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

function renderFootnoteRef(
  ref: string,
  key: string,
  language: Language,
  lessonBundle: GrammarLessonBundle | undefined,
  inheritTextColor: boolean,
) {
  const footnote = lessonBundle?.footnotes.find((item) => item.id === ref);

  if (!footnote || !lessonBundle) {
    return (
      <sup key={key} className="text-xs font-semibold text-sky-700 dark:text-sky-300">
        [{ref}]
      </sup>
    );
  }

  const number = lessonBundle.footnotes.findIndex((item) => item.id === ref) + 1;

  return (
    <Footnote
      key={key}
      number={number}
      content={
        <GrammarBlockRenderer
          blocks={footnote.content[language]}
          language={language}
          lessonBundle={lessonBundle}
          className="space-y-2"
          inheritTextColor={inheritTextColor}
        />
      }
    />
  );
}

function renderExerciseGroup(
  exerciseIds: readonly string[],
  lessonBundle: GrammarLessonBundle | undefined,
  language: Language,
) {
  const exercises =
    lessonBundle?.exercises.filter((exercise) => exerciseIds.includes(exercise.id)) ?? [];

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <GrammarLessonCard key={exercise.id} tone="sky" className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {exercise.title[language]}
            </h3>
            <div className="mt-2 text-sm leading-7 text-stone-700 dark:text-stone-300">
              <GrammarBlockRenderer
                blocks={exercise.prompt[language]}
                language={language}
                lessonBundle={lessonBundle}
              />
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

function renderExampleGroup(
  exampleIds: readonly string[],
  lessonBundle: GrammarLessonBundle | undefined,
  language: Language,
) {
  const examples =
    lessonBundle?.examples.filter((example) => exampleIds.includes(example.id)) ?? [];

  if (examples.length === 0) {
    return null;
  }

  return (
    <GrammarLessonCard className="space-y-3">
      <ul className="space-y-3">
        {examples.map((example) => (
          <li key={example.id} className="leading-7 text-stone-700 dark:text-stone-300">
            <span className="font-coptic text-xl text-emerald-600 dark:text-emerald-400">
              {renderExampleCopticText(example.coptic)}
            </span>
            <span className="ml-3">{example.translation[language]}</span>
          </li>
        ))}
      </ul>
    </GrammarLessonCard>
  );
}

function renderBlock(
  block: GrammarBlock,
  index: number,
  language: Language,
  lessonBundle: GrammarLessonBundle | undefined,
  inheritTextColor: boolean,
) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          key={`${block.type}-${index}`}
          className={cx(
            "leading-7",
            inheritTextColor ? "text-inherit" : "text-stone-700 dark:text-stone-300",
          )}
        >
          <GrammarInlineRenderer
            nodes={block.content}
            language={language}
            renderFootnoteRef={(ref, key) =>
              renderFootnoteRef(ref, key, language, lessonBundle, inheritTextColor)
            }
          />
        </p>
      );
    case "heading": {
      const HeadingTag = block.level === 2 ? "h2" : "h3";

      return (
        <HeadingTag
          key={`${block.type}-${block.id}`}
          id={block.id}
          className={cx(
            "font-semibold text-stone-900 dark:text-stone-100",
            block.level === 2 ? "text-2xl" : "text-xl",
          )}
        >
          <GrammarInlineRenderer
            nodes={block.content}
            language={language}
            renderFootnoteRef={(ref, key) =>
              renderFootnoteRef(ref, key, language, lessonBundle, inheritTextColor)
            }
          />
        </HeadingTag>
      );
    }
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul";

      return (
        <ListTag
          key={`${block.type}-${index}`}
          className={cx(
            "ml-5 space-y-3",
            block.style === "ordered" ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item) => (
            <li
              key={item.id}
              className={cx(
                "space-y-3",
                inheritTextColor ? "text-inherit" : "text-stone-700 dark:text-stone-300",
              )}
            >
              <GrammarBlockRenderer
                blocks={item.blocks}
                language={language}
                lessonBundle={lessonBundle}
                inheritTextColor={inheritTextColor}
              />
            </li>
          ))}
        </ListTag>
      );
    }
    case "table":
      return (
        <GrammarLessonTable key={`${block.type}-${block.id}`}>
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-800">
              {block.columns.map((column) => (
                <th
                  key={column.id}
                  className="border-b p-3 font-semibold dark:border-stone-700"
                >
                  {column.label[language]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {block.rows.map((row) => (
              <tr key={row.id} className="align-top">
                {block.columns.map((column) => (
                  <td key={column.id} className="p-3">
                    <GrammarBlockRenderer
                      blocks={row.cells[column.id] ?? []}
                      language={language}
                      lessonBundle={lessonBundle}
                      inheritTextColor={inheritTextColor}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </GrammarLessonTable>
      );
    case "callout":
      return (
        <GrammarLessonCard
          key={`${block.type}-${index}`}
          tone={block.tone === "info" ? "sky" : "stone"}
          className={cx(
            "space-y-3",
            block.tone === "warning" &&
              "border-amber-200 bg-amber-50 dark:border-amber-900/80 dark:bg-amber-950/30",
          )}
        >
          {block.title ? (
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {block.title[language]}
            </h3>
          ) : null}
          <GrammarBlockRenderer
            blocks={block.blocks}
            language={language}
            lessonBundle={lessonBundle}
            inheritTextColor={inheritTextColor}
          />
        </GrammarLessonCard>
      );
    case "exampleGroup":
      return (
        <div key={`${block.type}-${index}`}>
          {renderExampleGroup(block.refs, lessonBundle, language)}
        </div>
      );
    case "exerciseGroup":
      return (
        <div key={`${block.type}-${index}`}>
          {renderExerciseGroup(block.refs, lessonBundle, language)}
        </div>
      );
    default: {
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}

export function GrammarBlockRenderer({
  blocks,
  language,
  lessonBundle,
  className,
  inheritTextColor = false,
}: GrammarBlockRendererProps) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cx("space-y-4", className)}>
      {blocks.map((block, index) =>
        renderBlock(block, index, language, lessonBundle, inheritTextColor),
      )}
    </div>
  );
}
