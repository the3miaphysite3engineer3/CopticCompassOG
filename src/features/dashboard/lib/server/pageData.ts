import type { User } from "@supabase/supabase-js";
import { getUserEntryFavorites } from "@/features/dictionary/lib/server/queries";
import { getDictionaryEntryById } from "@/features/dictionary/lib/dictionary";
import type { EntryFavoriteWithEntry } from "@/features/dictionary/lib/entryActions";
import {
  buildGrammarLessonLearnerSummary,
  type GrammarLessonLearnerSummary,
} from "@/features/grammar/lib/grammarLearnerState";
import {
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import {
  getUserLessonBookmarks,
  getUserLessonNotes,
  getUserLessonProgressRows,
  getUserSectionProgressRows,
} from "@/features/grammar/lib/server/queries";
import { getAccountAuthSettings } from "@/features/profile/lib/accountSettings";
import {
  getAudienceContactForProfile,
  getProfile,
} from "@/features/profile/lib/server/queries";
import { getUserSubmissions } from "@/features/submissions/lib/server/queries";
import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import type { Language } from "@/types/i18n";
import type { Tables } from "@/types/supabase";

export type DashboardPageData = {
  audienceContact: Awaited<ReturnType<typeof getAudienceContactForProfile>>;
  canUpdatePassword: boolean;
  grammarLessonSummaries: GrammarLessonLearnerSummary[];
  profile: Tables<"profiles">;
  providerLabel: string;
  savedDictionaryEntries: EntryFavoriteWithEntry[];
  submissions: Awaited<ReturnType<typeof getUserSubmissions>>;
};

function buildSavedDictionaryEntries(
  entryFavorites: Awaited<ReturnType<typeof getUserEntryFavorites>>,
): EntryFavoriteWithEntry[] {
  return entryFavorites.map((favorite) => ({
    entry: getDictionaryEntryById(favorite.entry_id),
    favorite,
  }));
}

function buildGrammarLessonSummaries({
  lessonBookmarks,
  lessonNotes,
  lessonProgressRows,
  sectionProgressRows,
}: {
  lessonBookmarks: Awaited<ReturnType<typeof getUserLessonBookmarks>>;
  lessonNotes: Awaited<ReturnType<typeof getUserLessonNotes>>;
  lessonProgressRows: Awaited<ReturnType<typeof getUserLessonProgressRows>>;
  sectionProgressRows: Awaited<ReturnType<typeof getUserSectionProgressRows>>;
}) {
  return listPublishedGrammarLessons()
    .map((lesson) => getPublishedGrammarLessonBundleBySlug(lesson.slug))
    .filter(
      (lessonBundle): lessonBundle is NonNullable<typeof lessonBundle> =>
        lessonBundle !== null,
    )
    .map((lessonBundle) =>
      buildGrammarLessonLearnerSummary({
        bookmarkRows: lessonBookmarks,
        lessonBundle,
        lessonNoteRows: lessonNotes,
        lessonProgressRows,
        sectionProgressRows,
      }),
    );
}

export async function loadDashboardPageData({
  locale,
  supabase,
  user,
}: {
  locale: Language;
  supabase: AppSupabaseClient;
  user: User;
}): Promise<DashboardPageData | null> {
  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return null;
  }

  const [
    audienceContact,
    submissions,
    lessonProgressRows,
    sectionProgressRows,
    entryFavorites,
    lessonBookmarks,
    lessonNotes,
  ] = await Promise.all([
    getAudienceContactForProfile(supabase, user.id, profile.email),
    getUserSubmissions(supabase, user.id),
    getUserLessonProgressRows(supabase, user.id),
    getUserSectionProgressRows(supabase, user.id),
    getUserEntryFavorites(supabase, user.id),
    getUserLessonBookmarks(supabase, user.id),
    getUserLessonNotes(supabase, user.id),
  ]);

  const { canUpdatePassword, providerLabel } = getAccountAuthSettings(
    user.app_metadata,
    locale,
  );

  return {
    audienceContact,
    canUpdatePassword,
    grammarLessonSummaries: buildGrammarLessonSummaries({
      lessonBookmarks,
      lessonNotes,
      lessonProgressRows,
      sectionProgressRows,
    }),
    profile,
    providerLabel,
    savedDictionaryEntries: buildSavedDictionaryEntries(entryFavorites),
    submissions,
  };
}
