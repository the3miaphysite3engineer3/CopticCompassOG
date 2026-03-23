import "../../globals.css";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { createRootLayoutMetadata } from "@/lib/metadata";
import { PUBLIC_LOCALES, isPublicLocale } from "@/lib/locale";

async function resolveLocale(paramsPromise: Promise<unknown>) {
  const params = (await paramsPromise) as { locale?: string };
  const locale = params.locale;

  if (!locale || !isPublicLocale(locale)) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<unknown>;
}) {
  const locale = await resolveLocale(params);
  return createRootLayoutMetadata(locale);
}

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<unknown>;
}>) {
  const locale = await resolveLocale(params);

  return (
    <html lang={locale} suppressHydrationWarning>
      <AppFrame initialLanguage={locale} localeRouting>
        {children}
      </AppFrame>
    </html>
  );
}
