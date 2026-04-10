import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { FloatingAiAssistant } from "@/components/FloatingAiAssistant";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getCspNonce } from "@/lib/server/csp";
import type { Language } from "@/types/i18n";

type AppFrameProps = {
  children: ReactNode;
  initialLanguage: Language;
  localeRouting?: boolean;
};

export async function AppFrame({
  children,
  initialLanguage,
  localeRouting = false,
}: AppFrameProps) {
  const nonce = await getCspNonce();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      nonce={nonce}
    >
      <LanguageProvider
        initialLanguage={initialLanguage}
        localeRouting={localeRouting}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingAiAssistant />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
