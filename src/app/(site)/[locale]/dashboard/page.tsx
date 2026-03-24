import type { Metadata } from "next";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";
import { getDashboardCopy } from "@/features/dashboard/lib/dashboardCopy";
import { createNoIndexMetadata } from "@/lib/metadata";
import { isPublicLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isPublicLocale(locale) ? locale : "en";
  const copy = getDashboardCopy(resolvedLocale);

  return createNoIndexMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
  });
}

export default async function LocalizedDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = isPublicLocale(locale) ? locale : "en";

  return <DashboardPageContent locale={resolvedLocale} />;
}

