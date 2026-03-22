import { createGrammarExportSnapshot, createGrammarLessonBundle } from "@/content/grammar/build";
import {
  getGrammarManifest,
  getGrammarLessonDocumentBySlug,
  listGrammarLessonIndexItems,
} from "@/content/grammar/registry";
import type {
  GrammarLessonBundle,
  GrammarLessonIndexItem,
  GrammarSectionDocument,
} from "@/content/grammar/schema";

export type GrammarLessonOutlineItem = Pick<GrammarSectionDocument, "id" | "slug" | "title">;

export function getGrammarManifestData() {
  return getGrammarManifest();
}

export function listGrammarLessons(): GrammarLessonIndexItem[] {
  return listGrammarLessonIndexItems();
}

export function listPublishedGrammarLessons(): GrammarLessonIndexItem[] {
  return listGrammarLessons().filter((lesson) => lesson.status === "published");
}

export function getGrammarLessonBundleBySlug(slug: string): GrammarLessonBundle | null {
  const lesson = getGrammarLessonDocumentBySlug(slug);

  if (!lesson) {
    return null;
  }

  return createGrammarLessonBundle(lesson);
}

export function getPublishedGrammarLessonBundleBySlug(
  slug: string,
): GrammarLessonBundle | null {
  const bundle = getGrammarLessonBundleBySlug(slug);

  if (!bundle || bundle.lesson.status !== "published") {
    return null;
  }

  return bundle;
}

export function getGrammarLessonOutlineBySlug(
  slug: string,
): GrammarLessonOutlineItem[] | null {
  const bundle = getGrammarLessonBundleBySlug(slug);

  if (!bundle) {
    return null;
  }

  const sectionsById = new Map(
    bundle.lesson.sections.map((section) => [section.id, section] as const),
  );

  return bundle.lesson.sectionOrder
    .map((sectionId) => sectionsById.get(sectionId))
    .filter((section): section is GrammarSectionDocument => section !== undefined)
    .map((section) => ({
      id: section.id,
      slug: section.slug,
      title: section.title,
    }));
}

export function getGrammarExportData() {
  return createGrammarExportSnapshot();
}
