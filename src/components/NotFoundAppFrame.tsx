"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getPublicLocaleFromPathname } from "@/lib/locale";
import type { Language } from "@/types/i18n";

import type { ReactNode } from "react";

type NotFoundAppFrameProps = {
  children: ReactNode;
  nonce?: string;
  preferredLanguage: Language;
};

export function NotFoundAppFrame({
  children,
  nonce,
  preferredLanguage,
}: NotFoundAppFrameProps) {
  const pathname = usePathname() ?? "";
  const routeLanguage = getPublicLocaleFromPathname(pathname);
  const language = routeLanguage ?? preferredLanguage;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      nonce={nonce}
    >
      <LanguageProvider
        initialLanguage={language}
        localeRouting={Boolean(routeLanguage)}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
