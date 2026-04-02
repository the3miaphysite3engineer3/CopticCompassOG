import type { Metadata } from "next";
import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
import { createNoIndexMetadata } from "@/lib/metadata";
import { requirePublicLocale } from "@/lib/publicLocaleRouting";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Instructor Workspace",
  description:
    "Private instructor workspace for reviewing grammar submissions.",
});

export default async function LocalizedAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = requirePublicLocale((await params).locale);

  return <AdminDashboardPage redirectTo={`/${locale}/admin`} />;
}
