import type { Metadata } from "next";
import "../globals.css";
import { AppFrame } from "@/components/AppFrame";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { createRootLayoutMetadata } from "@/lib/metadata";

export const metadata: Metadata = createRootLayoutMetadata(DEFAULT_LANGUAGE);

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LANGUAGE} suppressHydrationWarning>
      <AppFrame initialLanguage={DEFAULT_LANGUAGE}>{children}</AppFrame>
    </html>
  );
}
