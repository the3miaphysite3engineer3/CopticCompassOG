import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { buildEntryOpenGraphPreview } from "@/features/dictionary/lib/entryOpenGraph";
import {
  getDictionary,
  getDictionaryEntryRelations,
} from "@/features/dictionary/lib/dictionary";
import { buildLessonOpenGraphPreview } from "@/features/grammar/lib/lessonOpenGraph";
import {
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import {
  renderEntryOpenGraphCard,
  renderLessonOpenGraphCard,
  renderPublicationOpenGraphCard,
  renderSiteOpenGraphCard,
} from "@/features/seo/lib/openGraphCards";
import {
  getOpenGraphBrandLabel,
  getOpenGraphSectionFooter,
  normalizeOpenGraphCardType,
} from "@/features/seo/lib/openGraph";
import { buildPublicationOpenGraphPreview } from "@/features/publications/lib/publicationOpenGraph";
import {
  getPublicationById,
  publications,
} from "@/features/publications/lib/publications";
import { isPublicLocale } from "@/lib/locale";
import { siteConfig } from "@/lib/site";

const antinoouFontPromise = readFile(
  join(process.cwd(), "src/fonts/AntinoouFont-1.0.6/Antinoou.ttf"),
);

function renderGenericCard(locale: string) {
  const language = isPublicLocale(locale) ? locale : "en";

  return renderSiteOpenGraphCard({
    descriptor:
      language === "nl"
        ? "Koptisch woordenboek, grammatica en publicaties"
        : siteConfig.descriptor,
    eyebrow:
      language === "nl"
        ? "Digitaal thuis voor Koptologie"
        : "Digital home for Coptology",
    footerLabel: getOpenGraphSectionFooter("site", language),
    stats: [
      {
        label: language === "nl" ? "Woordenboek" : "Dictionary",
        value:
          language === "nl"
            ? `${siteConfig.dictionaryEntryCount.toLocaleString("nl-BE")} lemma's`
            : `${siteConfig.dictionaryEntryCount.toLocaleString("en-US")} entries`,
      },
      {
        label: language === "nl" ? "Grammatica" : "Grammar",
        value:
          language === "nl"
            ? `${listPublishedGrammarLessons().length.toLocaleString("nl-BE")} gepubliceerde lessen`
            : `${listPublishedGrammarLessons().length.toLocaleString("en-US")} published lessons`,
      },
      {
        label: language === "nl" ? "Publicaties" : "Publications",
        value:
          language === "nl"
            ? `${publications.length.toLocaleString("nl-BE")} titels`
            : `${publications.length.toLocaleString("en-US")} titles`,
      },
    ],
    summary:
      language === "nl"
        ? "Doorzoek het woordenboek, volg grammaticallessen en verken publicaties in een rustige Koptische werkruimte."
        : "Search the dictionary, follow grammar lessons, and browse publications in one calm Coptic workspace.",
    title: getOpenGraphBrandLabel(language),
  });
}

function renderEntryCard(id: string, locale: string) {
  const language = isPublicLocale(locale) ? locale : "en";
  const dictionary = getDictionary();
  const entry = dictionary.find((item) => item.id === id);

  if (!entry) {
    return renderGenericCard(locale);
  }

  const { parentEntry, relatedEntries } = getDictionaryEntryRelations(
    entry,
    dictionary,
  );
  const preview = buildEntryOpenGraphPreview({
    entry,
    language,
    parentEntry,
    relatedEntries,
  });
  const footerLabel = getOpenGraphSectionFooter("dictionary", language);
  const relatedLabel = language === "nl" ? "Verwante vormen" : "Related forms";
  const partOfSpeechLabel = language === "nl" ? "Woordsoort" : "Part of speech";

  return renderEntryOpenGraphCard({
    footerLabel,
    gloss: preview.gloss,
    heading: preview.heading,
    partOfSpeech: entry.pos,
    partOfSpeechLabel,
    relatedForms: preview.relatedForms,
    relatedLabel,
    strapline: preview.strapline,
  });
}

function renderLessonCard(slug: string, locale: string) {
  const language = isPublicLocale(locale) ? locale : "en";
  const lessonBundle = getPublishedGrammarLessonBundleBySlug(slug);

  if (!lessonBundle) {
    return renderGenericCard(locale);
  }

  const preview = buildLessonOpenGraphPreview(lessonBundle, language);

  return renderLessonOpenGraphCard(preview);
}

function renderPublicationCard(id: string, locale: string) {
  const language = isPublicLocale(locale) ? locale : "en";
  const publication = getPublicationById(id);

  if (!publication) {
    return renderGenericCard(locale);
  }

  const preview = buildPublicationOpenGraphPreview(publication, language);
  return renderPublicationOpenGraphCard(preview);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = normalizeOpenGraphCardType(searchParams.get("type"));
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const locale = searchParams.get("locale") ?? "en";
  const antinoouFont = await antinoouFontPromise;
  const imageContent =
    type === "entry" && id
      ? renderEntryCard(id, locale)
      : type === "lesson" && slug
        ? renderLessonCard(slug, locale)
        : type === "publication" && id
          ? renderPublicationCard(id, locale)
          : renderGenericCard(locale);

  return new ImageResponse(imageContent, {
    fonts: [
      {
        name: "Antinoou",
        data: antinoouFont,
        style: "normal",
        weight: 400,
      },
    ],
    width: 1200,
    height: 630,
  });
}
