import { grammarLesson01SourceIds } from "../lesson-01-ids.ts";

import type { GrammarSourceDocument } from "../../schema.ts";

export const grammarLesson01CoreSources: readonly GrammarSourceDocument[] = [
  {
    id: grammarLesson01SourceIds.forthcomingBasisgrammatica,
    title: "Inleiding tot het Bohairisch Koptisch: Basisgrammatica",
    subtitle: "Deel I (3 delen)",
    author: "Kyrillos Wannes",
    url: "/publications/basisgrammatica-bohairisch-koptisch",
    publicationId: "basisgrammatica-bohairisch-koptisch",
    comingSoon: true,
  },
] as const;
