import type { ReactNode } from "react";
import type { GrammarLessonBundle, GrammarSectionDocument } from "@/content/grammar/schema";
import type { Language } from "@/types/i18n";
import {
  GrammarLessonEndnotes,
  GrammarLessonSection,
} from "@/features/grammar/components/GrammarLessonPrimitives";
import {
  GrammarLessonConceptGlossary as GrammarLessonConceptGlossarySection,
  GrammarLessonBibliography as GrammarLessonBibliographySection,
} from "@/features/grammar/components/GrammarLessonSemantics";
import { GrammarBlockRenderer } from "./GrammarBlockRenderer";

type GrammarLessonDocumentRendererProps = {
  lessonBundle: GrammarLessonBundle;
  language: Language;
  renderSectionFooter?: (section: GrammarSectionDocument) => ReactNode;
};

function getOrderedSections(
  lessonBundle: GrammarLessonBundle,
): GrammarSectionDocument[] {
  const sectionsById = new Map(
    lessonBundle.lesson.sections.map((section) => [section.id, section] as const),
  );

  return lessonBundle.lesson.sectionOrder
    .map((sectionId) => sectionsById.get(sectionId))
    .filter((section): section is GrammarSectionDocument => section !== undefined);
}

export function GrammarLessonDocumentRenderer({
  lessonBundle,
  language,
  renderSectionFooter,
}: GrammarLessonDocumentRendererProps) {
  const orderedSections = getOrderedSections(lessonBundle);
  const endnotesTitle = language === "en" ? "Endnotes" : "Eindnoten";

  return (
    <div className="space-y-4 font-sans leading-relaxed text-stone-800 dark:text-stone-200">
      {orderedSections.map((section, index) => (
        <GrammarLessonSection
          key={section.id}
          id={section.id}
          index={index + 1}
          title={section.title[language]}
          footer={renderSectionFooter?.(section)}
        >
          <GrammarBlockRenderer
            blocks={section.blocks[language]}
            language={language}
            lessonBundle={lessonBundle}
          />
        </GrammarLessonSection>
      ))}

      <GrammarLessonConceptGlossarySection
        lessonBundle={lessonBundle}
        language={language}
      />
      <GrammarLessonBibliographySection
        lessonBundle={lessonBundle}
        language={language}
      />
      <GrammarLessonEndnotes title={endnotesTitle} />
    </div>
  );
}
