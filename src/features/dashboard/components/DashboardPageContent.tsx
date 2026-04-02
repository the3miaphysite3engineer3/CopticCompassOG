import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { DashboardRecentExercisesSection } from "@/features/dashboard/components/DashboardRecentExercisesSection";
import { DashboardWelcomePanel } from "@/features/dashboard/components/DashboardWelcomePanel";
import { DictionaryFavoritesOverview } from "@/features/dictionary/components/DictionaryFavoritesOverview";
import { GrammarDashboardOverview } from "@/features/grammar/components/GrammarDashboardOverview";
import { AccountSettingsPanel } from "@/features/profile/components/AccountSettingsPanel";
import { getDashboardCopy } from "@/features/dashboard/lib/dashboardCopy";
import { DEFAULT_DICTIONARY_DIALECT_FILTER } from "@/features/dictionary/config";
import { loadDashboardPageData } from "@/features/dashboard/lib/server/pageData";
import { getDashboardPath } from "@/lib/locale";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { getLoginPath } from "@/lib/supabase/config";
import type { Language } from "@/types/i18n";

type DashboardPageContentProps = {
  locale: Language;
};

export async function DashboardPageContent({
  locale,
}: DashboardPageContentProps) {
  const dashboardPath = getDashboardPath(locale);
  const copy = getDashboardCopy(locale);
  const { supabase, user } =
    await requireAuthenticatedPageSession(dashboardPath);
  const dashboardData = await loadDashboardPageData({
    locale,
    supabase,
    user,
  });
  if (!dashboardData) {
    return redirect(getLoginPath(dashboardPath));
  }

  return (
    <PageShell
      className="min-h-screen px-6 py-16"
      contentClassName="mx-auto min-h-[80vh] max-w-5xl"
      accents={[
        pageShellAccents.topLeftSkyOrb,
        pageShellAccents.bottomRightEmeraldOrb,
      ]}
    >
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <Badge tone="accent" size="xs" caps className="mb-4">
            {copy.shellBadge}
          </Badge>
          <PageHeader
            title={copy.pageTitle}
            description={copy.pageDescription}
            align="left"
            tone="brand"
            size="compact"
          />
        </div>
        <form action={logout}>
          <input type="hidden" name="redirectTo" value={dashboardPath} />
          <button className="btn-secondary px-6">{copy.signOut}</button>
        </form>
      </div>

      <div className="flex flex-col gap-12">
        <DashboardWelcomePanel
          locale={locale}
          profile={dashboardData.profile}
        />

        <AccountSettingsPanel
          audienceContact={dashboardData.audienceContact}
          canUpdatePassword={dashboardData.canUpdatePassword}
          profile={dashboardData.profile}
          providerLabel={dashboardData.providerLabel}
        />

        <GrammarDashboardOverview
          language={locale}
          lessonSummaries={dashboardData.grammarLessonSummaries}
        />

        <DictionaryFavoritesOverview
          favorites={dashboardData.savedDictionaryEntries}
          language={locale}
          preferredDialect={
            dashboardData.profile.preferred_dictionary_dialect ??
            DEFAULT_DICTIONARY_DIALECT_FILTER
          }
        />

        <DashboardRecentExercisesSection
          locale={locale}
          submissions={dashboardData.submissions}
        />
      </div>
    </PageShell>
  );
}
