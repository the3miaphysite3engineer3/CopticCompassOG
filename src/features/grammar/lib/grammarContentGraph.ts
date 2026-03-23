import type {
  GrammarBlock,
  GrammarInline,
  GrammarLessonBundle,
  GrammarLessonIndexItem,
} from "@/content/grammar/schema";
import {
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";

export type GrammarLessonReference = Pick<
  GrammarLessonIndexItem,
  "id" | "slug" | "number" | "title" | "summary"
>;

type GrammarContentGraph = {
  lessonsByEntryId: Map<string, GrammarLessonReference[]>;
  lessonsByPublicationId: Map<string, GrammarLessonReference[]>;
  rankedEntryIdsByLessonSlug: Map<string, string[]>;
};

let cachedGraph: GrammarContentGraph | null = null;

function incrementEntryCount(entryCounts: Map<string, number>, entryId?: string) {
  if (!entryId) {
    return;
  }

  entryCounts.set(entryId, (entryCounts.get(entryId) ?? 0) + 1);
}

function collectEntryIdsFromInlineNodes(
  nodes: readonly GrammarInline[],
  entryCounts: Map<string, number>,
) {
  for (const node of nodes) {
    switch (node.type) {
      case "coptic":
        incrementEntryCount(entryCounts, node.dictionaryEntryId);
        break;
      case "copticSpan":
        incrementEntryCount(entryCounts, node.dictionaryEntryId);
        collectEntryIdsFromInlineNodes(node.children, entryCounts);
        break;
      case "strong":
      case "em":
      case "smallCaps":
      case "underline":
      case "superscript":
      case "link":
        collectEntryIdsFromInlineNodes(node.children, entryCounts);
        break;
      default:
        break;
    }
  }
}

function collectEntryIdsFromBlocks(
  blocks: readonly GrammarBlock[],
  entryCounts: Map<string, number>,
) {
  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
      case "heading":
        collectEntryIdsFromInlineNodes(block.content, entryCounts);
        break;
      case "list":
        for (const item of block.items) {
          collectEntryIdsFromBlocks(item.blocks, entryCounts);
        }
        break;
      case "table":
        for (const column of block.columns) {
          if (column.inlineLabel) {
            collectEntryIdsFromInlineNodes(column.inlineLabel.en, entryCounts);
          }
        }
        for (const headerRow of block.headerRows ?? []) {
          for (const cell of headerRow.cells) {
            if (cell.inlineLabel) {
              collectEntryIdsFromInlineNodes(cell.inlineLabel.en, entryCounts);
            }
          }
        }
        for (const row of block.rows) {
          for (const cellBlocks of Object.values(row.cells)) {
            collectEntryIdsFromBlocks(cellBlocks, entryCounts);
          }
        }
        break;
      case "callout":
        collectEntryIdsFromBlocks(block.blocks, entryCounts);
        break;
      default:
        break;
    }
  }
}

function createLessonReference(
  lesson: GrammarLessonIndexItem,
): GrammarLessonReference {
  return {
    id: lesson.id,
    slug: lesson.slug,
    number: lesson.number,
    title: lesson.title,
    summary: lesson.summary,
  };
}

function collectRankedEntryIdsForLesson(
  lessonBundle: GrammarLessonBundle,
) {
  const entryCounts = new Map<string, number>();

  for (const section of lessonBundle.lesson.sections) {
    collectEntryIdsFromBlocks(section.blocks.en, entryCounts);
  }

  for (const concept of lessonBundle.concepts) {
    collectEntryIdsFromBlocks(concept.definition.en, entryCounts);
  }

  for (const example of lessonBundle.examples) {
    for (const entryId of example.dictionaryRefs) {
      incrementEntryCount(entryCounts, entryId);
    }

    for (const segment of example.copticSegments ?? []) {
      incrementEntryCount(entryCounts, segment.dictionaryEntryId);
    }

    if (example.notes) {
      collectEntryIdsFromBlocks(example.notes.en, entryCounts);
    }
  }

  for (const exercise of lessonBundle.exercises) {
    collectEntryIdsFromBlocks(exercise.prompt.en, entryCounts);
  }

  for (const footnote of lessonBundle.footnotes) {
    collectEntryIdsFromBlocks(footnote.content.en, entryCounts);
  }

  return [...entryCounts.entries()]
    .sort((left, right) => {
      const countDiff = right[1] - left[1];
      return countDiff !== 0 ? countDiff : left[0].localeCompare(right[0]);
    })
    .map(([entryId]) => entryId);
}

function buildGraph(): GrammarContentGraph {
  const lessonsByEntryId = new Map<string, GrammarLessonReference[]>();
  const lessonsByPublicationId = new Map<string, GrammarLessonReference[]>();
  const rankedEntryIdsByLessonSlug = new Map<string, string[]>();

  for (const lesson of listPublishedGrammarLessons()) {
    const lessonBundle = getPublishedGrammarLessonBundleBySlug(lesson.slug);

    if (!lessonBundle) {
      continue;
    }

    const lessonRef = createLessonReference(lesson);
    const rankedEntryIds = collectRankedEntryIdsForLesson(lessonBundle);
    rankedEntryIdsByLessonSlug.set(lesson.slug, rankedEntryIds);

    for (const entryId of rankedEntryIds) {
      const linkedLessons = lessonsByEntryId.get(entryId) ?? [];
      linkedLessons.push(lessonRef);
      lessonsByEntryId.set(entryId, linkedLessons);
    }

    for (const source of lessonBundle.sources) {
      if (!source.publicationId) {
        continue;
      }

      const linkedLessons = lessonsByPublicationId.get(source.publicationId) ?? [];

      if (!linkedLessons.some((linkedLesson) => linkedLesson.id === lessonRef.id)) {
        linkedLessons.push(lessonRef);
        lessonsByPublicationId.set(source.publicationId, linkedLessons);
      }
    }
  }

  return {
    lessonsByEntryId,
    lessonsByPublicationId,
    rankedEntryIdsByLessonSlug,
  };
}

function getGraph() {
  if (!cachedGraph) {
    cachedGraph = buildGraph();
  }

  return cachedGraph;
}

export function listPublishedGrammarLessonsForEntry(entryId: string) {
  return getGraph().lessonsByEntryId.get(entryId) ?? [];
}

export function listPublishedGrammarLessonsForPublication(publicationId: string) {
  return getGraph().lessonsByPublicationId.get(publicationId) ?? [];
}

export function listRankedDictionaryEntryIdsForPublishedLesson(
  slug: string,
  limit = 12,
) {
  return (getGraph().rankedEntryIdsByLessonSlug.get(slug) ?? []).slice(0, limit);
}
