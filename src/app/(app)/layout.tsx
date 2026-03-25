import type { Metadata } from "next";
import "@/app/globals.css";
import { AppFrame } from "@/components/AppFrame";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";
import { createRootLayoutMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();
  return createRootLayoutMetadata(language);
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getPreferredLanguage();

  return (
    <html lang={language} suppressHydrationWarning>
      <AppFrame initialLanguage={language}>{children}</AppFrame>
    </html>
  );
}
