import {
  AdminAudienceSection,
  AdminContactInboxSection,
  AdminEntryReportsSection,
  AdminNotificationsSection,
  AdminReleasesSection,
  AdminSubmissionsSection,
  AdminWorkspaceQuickJump,
} from "@/features/admin/components/AdminDashboardSections";
import {
  buildAdminWorkspaceOverview,
  loadAdminDashboardData,
} from "@/features/admin/lib/dashboardData";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { requireAdminPageSession } from "@/lib/supabase/auth";

export async function AdminDashboardPage({
  redirectTo = "/admin",
}: {
  redirectTo?: string;
}) {
  const { supabase } = await requireAdminPageSession(redirectTo);
  const dashboardData = await loadAdminDashboardData(supabase);
  const workspaceOverview = buildAdminWorkspaceOverview(dashboardData);

  return (
    <PageShell
      className="min-h-screen px-6 py-16"
      contentClassName="mx-auto min-h-[80vh] max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700"
      accents={[
        pageShellAccents.heroEmeraldArc,
        pageShellAccents.topRightSkyOrbInset,
      ]}
    >
      <PageHeader
        eyebrow="Instructor Workspace"
        eyebrowVariant="badge"
        title="Instructor Terminal"
        description="Review submitted exercises, score translations, and send feedback."
        align="left"
        tone="analytics"
        size="compact"
        className="mb-12"
      />

      <AdminWorkspaceQuickJump overview={workspaceOverview} />

      <div className="space-y-8">
        <AdminSubmissionsSection submissions={dashboardData.submissions} />
        <AdminAudienceSection audience={dashboardData.audience} />
        <AdminReleasesSection contentReleases={dashboardData.contentReleases} />
        <AdminContactInboxSection
          contactMessages={dashboardData.contactMessages}
        />
        <AdminNotificationsSection
          notifications={dashboardData.notifications}
        />
        <AdminEntryReportsSection entryReports={dashboardData.entryReports} />
      </div>
    </PageShell>
  );
}
