import type { Metadata } from "next";
import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
import { resolveAdminWorkspaceMode } from "@/features/admin/lib/workspaceMode";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Instructor Workspace",
  description:
    "Private instructor workspace for reviewing grammar submissions.",
});

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const modeValue = resolvedSearchParams?.mode;
  const initialMode = resolveAdminWorkspaceMode(
    Array.isArray(modeValue) ? modeValue[0] : modeValue,
  );

  return <AdminDashboardPage initialMode={initialMode} redirectTo="/admin" />;
}
