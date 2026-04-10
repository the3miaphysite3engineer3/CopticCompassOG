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

/**
 * Increments the occurrence count for a referenced dictionary entry while
 * safely ignoring empty or missing ids.
 */
function incrementEntryCount(
  entryCounts: Map<string, number>,
  entryId?: string,
) {
  if (!entryId) {
    return;
  }

  entryCounts.set(entryId, (entryCounts.get(entryId) ?? 0) + 1);
}

/**
 * Walks inline grammar nodes and counts every linked dictionary entry
 * reference that appears in the current inline tree.
 */
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

/**
 * Walks block-level grammar content recursively so dictionary references inside
 * paragraphs, lists, tables, callouts, and nested structures all contribute to
 * the lesson's ranked entry list.
 */
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

/**
 * Reduces a lesson index item to the compact reference shape stored in the
 * grammar content graph.
 */
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

/**
 * Builds the ranked dictionary-entry list for one lesson by counting
 * references across sections, concepts, examples, exercises, and footnotes.
 */
function collectRankedEntryIdsForLesson(lessonBundle: GrammarLessonBundle) {
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

/**
 * Builds the cached grammar content graph that links published lessons to
 * dictionary entries and publication sources.
 */
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

      const linkedLessons =
        lessonsByPublicationId.get(source.publicationId) ?? [];

      if (
        !linkedLessons.some((linkedLesson) => linkedLesson.id === lessonRef.id)
      ) {
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

/**
 * Returns the memoized grammar content graph, building it on first access.
 */
function getGraph() {
  if (!cachedGraph) {
    cachedGraph = buildGraph();
  }

  return cachedGraph;
}

/**
 * Lists published lessons that reference the requested dictionary entry.
 */
export function listPublishedGrammarLessonsForEntry(entryId: string) {
  return getGraph().lessonsByEntryId.get(entryId) ?? [];
}

/**
 * Lists published lessons that cite the requested publication source.
 */
export function listPublishedGrammarLessonsForPublication(
  publicationId: string,
) {
  return getGraph().lessonsByPublicationId.get(publicationId) ?? [];
}

/**
 * Returns the most strongly referenced dictionary entry ids for a published
 * lesson, truncated to the requested limit.
 */
function _listRankedDictionaryEntryIdsForPublishedLesson(
  slug: string,
  limit = 12,
) {
  return (getGraph().rankedEntryIdsByLessonSlug.get(slug) ?? []).slice(
    0,
    limit,
  );
}
