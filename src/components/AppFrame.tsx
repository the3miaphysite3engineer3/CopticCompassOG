import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { antinoou } from "@/lib/fonts";
import type { Language } from "@/types/i18n";

type AppFrameProps = {
  children: ReactNode;
  initialLanguage: Language;
  localeRouting?: boolean;
};

export function AppFrame({
  children,
  initialLanguage,
  localeRouting = false,
}: AppFrameProps) {
  return (
    <body className={antinoou.variable}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider initialLanguage={initialLanguage} localeRouting={localeRouting}>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </LanguageProvider>
      </ThemeProvider>
    </body>
  );
}
