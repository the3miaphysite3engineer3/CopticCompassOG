import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import {
  AdminAudienceSection,
  AdminCommunicationsDesk,
  AdminContactInboxSection,
  AdminEntryReportsSection,
  AdminNotificationsSection,
  AdminRagKnowledgeSection,
  AdminReleasesSection,
  AdminReviewInboxSummary,
  AdminSubmissionsSection,
  AdminSystemHealthSummary,
  AdminWorkspaceQuickJump,
} from "@/features/admin/components/AdminDashboardSections";
import { AdminWorkspaceModeShell } from "@/features/admin/components/AdminWorkspaceModeShell";
import { adminRouteCopy } from "@/features/admin/lib/adminRouteCopy";
import {
  loadAdminCommunicationsDashboardData,
  loadAdminReviewDashboardData,
  loadAdminSystemDashboardData,
  loadAdminWorkspaceOverview,
} from "@/features/admin/lib/dashboardData";
import type { AdminWorkspaceMode } from "@/features/admin/lib/workspaceMode";
import { requireAdminPageSession } from "@/lib/supabase/auth";
import type { Language } from "@/types/i18n";

import type { ReactNode } from "react";

export async function AdminDashboardPage({
  initialMode = "review",
  language,
  redirectTo = "/admin",
}: {
  initialMode?: AdminWorkspaceMode;
  language: Language;
  redirectTo?: string;
}) {
  const { supabase } = await requireAdminPageSession(redirectTo);
  const workspaceOverview = await loadAdminWorkspaceOverview(supabase);
  const copy = adminRouteCopy[language];
  const mode = initialMode;
  let modeContent: ReactNode;

  if (mode === "communications") {
    const dashboardData = await loadAdminCommunicationsDashboardData(supabase);

    modeContent = (
      <>
        <AdminCommunicationsDesk
          audience={dashboardData.audience}
          contentReleases={dashboardData.contentReleases}
          language={language}
          overview={workspaceOverview}
        />
        <AdminWorkspaceQuickJump
          language={language}
          overview={workspaceOverview}
          mode="communications"
        />

        <div className="space-y-8">
          <AdminReleasesSection
            contentReleases={dashboardData.contentReleases}
            language={language}
            showComposer={false}
          />
          <AdminAudienceSection
            audience={dashboardData.audience}
            language={language}
            showSyncForm={false}
          />
        </div>
      </>
    );
  } else if (mode === "system") {
    const dashboardData = await loadAdminSystemDashboardData(supabase);

    modeContent = (
      <>
        <AdminSystemHealthSummary
          language={language}
          overview={workspaceOverview}
          notifications={dashboardData.notifications}
        />
        <AdminWorkspaceQuickJump
          language={language}
          overview={workspaceOverview}
          mode="system"
        />

        <div className="space-y-8">
          <AdminNotificationsSection
            language={language}
            notifications={dashboardData.notifications}
          />
          <AdminRagKnowledgeSection language={language} />
        </div>
      </>
    );
  } else {
    const dashboardData = await loadAdminReviewDashboardData(supabase);

    modeContent = (
      <>
        <AdminReviewInboxSummary
          language={language}
          overview={workspaceOverview}
        />
        <AdminWorkspaceQuickJump
          language={language}
          overview={workspaceOverview}
          mode="review"
        />

        <div className="space-y-8">
          <AdminSubmissionsSection
            language={language}
            submissions={dashboardData.submissions}
          />
          <AdminContactInboxSection
            contactMessages={dashboardData.contactMessages}
            language={language}
          />
          <AdminEntryReportsSection
            entryReports={dashboardData.entryReports}
            language={language}
          />
          <AdminRagKnowledgeSection language={language} />
        </div>
      </>
    );
  }

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-700"
      width="standard"
      accents={[
        pageShellAccents.heroEmeraldArc,
        pageShellAccents.topRightSkyOrbInset,
      ]}
    >
      <PageHeader
        title={copy.pageTitle}
        description={copy.pageDescription}
        align="left"
        tone="analytics"
        size="workspace"
        className="mb-8 md:mb-12"
      />

      <AdminWorkspaceModeShell mode={mode} overview={workspaceOverview}>
        {modeContent}
      </AdminWorkspaceModeShell>
    </PageShell>
  );
}
