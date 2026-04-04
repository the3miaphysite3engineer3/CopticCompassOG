import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import { confirmAudienceOptInRequest } from "@/lib/communications/optInRequests";
import { getTranslation } from "@/lib/i18n";
import { getContactPath, getLocalizedHomePath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);

  return createNoIndexMetadata({
    title: getTranslation(resolvedLocale, "contact.confirm.title"),
    description: getTranslation(resolvedLocale, "contact.confirm.confirmed"),
  });
}

export default async function CommunicationConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);
  const { token } = await searchParams;
  const confirmationResult = await confirmAudienceOptInRequest(token ?? "");

  const messageKey =
    confirmationResult.status === "confirmed"
      ? "contact.confirm.confirmed"
      : confirmationResult.status === "already_confirmed"
        ? "contact.confirm.alreadyConfirmed"
        : confirmationResult.status === "expired"
          ? "contact.confirm.expired"
          : "contact.confirm.invalid";

  return (
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 md:p-10"
      contentClassName="w-full pt-10"
      width="standard"
      accents={[
        pageShellAccents.topLeftSkyOrb,
        pageShellAccents.bottomRightEmeraldOrb,
      ]}
    >
      <div className="mb-12 space-y-8">
        <BreadcrumbTrail
          items={[
            {
              label: getTranslation(resolvedLocale, "nav.home"),
              href: getLocalizedHomePath(resolvedLocale),
            },
            {
              label: getTranslation(resolvedLocale, "nav.contact"),
              href: getContactPath(resolvedLocale),
            },
            { label: getTranslation(resolvedLocale, "contact.confirm.title") },
          ]}
        />
        <PageHeader
          title={getTranslation(resolvedLocale, "contact.confirm.title")}
          description={getTranslation(resolvedLocale, messageKey)}
          tone="brand"
        />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <SurfacePanel rounded="3xl" className="p-8 md:p-10">
          <div className="space-y-6 text-center">
            <p className="text-base leading-7 text-stone-600 dark:text-stone-300">
              {getTranslation(resolvedLocale, messageKey)}
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={getLocalizedHomePath(resolvedLocale)}
                className="btn-primary px-6"
              >
                {getTranslation(resolvedLocale, "contact.confirm.homeCta")}
              </Link>
              <Link
                href={getContactPath(resolvedLocale)}
                className="btn-secondary px-6"
              >
                {getTranslation(resolvedLocale, "contact.confirm.contactCta")}
              </Link>
            </div>
          </div>
        </SurfacePanel>
      </div>
    </PageShell>
  );
}
