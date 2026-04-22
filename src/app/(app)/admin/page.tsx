import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
import { adminRouteCopy } from "@/features/admin/lib/adminRouteCopy";
import { resolveAdminWorkspaceMode } from "@/features/admin/lib/workspaceMode";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();
  const copy = adminRouteCopy[language];

  return createNoIndexMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
  });
}

/**
 * Loads the private instructor workspace and seeds it with the requested view
 * mode from the URL.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string | string[] }>;
}) {
  const [language, resolvedSearchParams] = await Promise.all([
    getPreferredLanguage(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  const modeValue = resolvedSearchParams?.mode;
  const initialMode = resolveAdminWorkspaceMode(
    Array.isArray(modeValue) ? modeValue[0] : modeValue,
  );

  return (
    <AdminDashboardPage
      initialMode={initialMode}
      language={language}
      redirectTo="/admin"
    />
  );
}
