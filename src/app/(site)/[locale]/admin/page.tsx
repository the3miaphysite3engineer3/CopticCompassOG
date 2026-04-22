import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
import { adminRouteCopy } from "@/features/admin/lib/adminRouteCopy";
import { resolveAdminWorkspaceMode } from "@/features/admin/lib/workspaceMode";
import { createNoIndexMetadata } from "@/lib/metadata";
import { requirePublicLocale } from "@/lib/publicLocaleRouting";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = requirePublicLocale((await params).locale);
  const copy = adminRouteCopy[locale];

  return createNoIndexMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
  });
}

/**
 * Loads the localized instructor workspace and seeds it with the requested view
 * mode from the URL.
 */
export default async function LocalizedAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ mode?: string | string[] }>;
}) {
  const locale = requirePublicLocale((await params).locale);
  const resolvedSearchParams = await searchParams;
  const modeValue = resolvedSearchParams?.mode;
  const initialMode = resolveAdminWorkspaceMode(
    Array.isArray(modeValue) ? modeValue[0] : modeValue,
  );

  return (
    <AdminDashboardPage
      initialMode={initialMode}
      language={locale}
      redirectTo={`/${locale}/admin`}
    />
  );
}
