import type { GrammarLessonDocument } from "../../schema.ts";
import { grammarDatasetRights } from "../rights.ts";

export const grammarLesson02Document: GrammarLessonDocument = {
  id: "grammar.lesson.02",
  slug: "lesson-2",
  number: 2,
  status: "draft",
  title: {
    en: "Lesson 02",
    nl: "Les 02",
  },
  summary: {
    en: "Dive into verbal prefixes, adjectives, and constructing complex nominal sentences.",
    nl: "Duik in werkwoordelijke voorvoegsels, bijvoeglijke naamwoorden en het construeren van complexe nominale zinnen.",
  },
  description: {
    en: "Planned continuation of the grammar course with more advanced morphology and nominal constructions.",
    nl: "Geplande voortzetting van de grammaticareeks met meer geavanceerde morfologie en nominale constructies.",
  },
  tags: ["planned", "draft"],
  rights: grammarDatasetRights,
  sectionOrder: [],
  sections: [],
  conceptRefs: [],
  exerciseRefs: [],
  sourceRefs: [],
};
