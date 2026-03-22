export const grammarLesson01Id = "grammar.lesson.01";

export const grammarLesson01ConceptIds = {
  bareNoun: "grammar.concept.bare-noun",
  determinedNoun: "grammar.concept.determined-noun",
  significantLetters: "grammar.concept.significant-letters",
  determinerSelection: "grammar.concept.determiner-selection",
  zeroDetermination: "grammar.concept.zero-determination",
  nexusPronouns: "grammar.concept.nexus-pronouns",
  bipartiteNominalSentence: "grammar.concept.bipartite-nominal-sentence",
  independentPersonalPronouns: "grammar.concept.independent-personal-pronouns",
  nominaSacra: "grammar.concept.nomina-sacra",
} as const;

export const grammarLesson01ConceptIdList = [
  grammarLesson01ConceptIds.bareNoun,
  grammarLesson01ConceptIds.determinedNoun,
  grammarLesson01ConceptIds.significantLetters,
  grammarLesson01ConceptIds.determinerSelection,
  grammarLesson01ConceptIds.zeroDetermination,
  grammarLesson01ConceptIds.nexusPronouns,
  grammarLesson01ConceptIds.bipartiteNominalSentence,
  grammarLesson01ConceptIds.independentPersonalPronouns,
  grammarLesson01ConceptIds.nominaSacra,
] as const;

export const grammarLesson01SourceIds = {
  forthcomingBasisgrammatica:
    "grammar.source.basisgrammatica-bohairisch-koptisch",
} as const;

export const grammarLesson01SourceIdList = [
  grammarLesson01SourceIds.forthcomingBasisgrammatica,
] as const;
