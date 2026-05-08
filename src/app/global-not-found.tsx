import "@/app/globals.css";

import { NotFoundAppFrame } from "@/components/NotFoundAppFrame";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ObservabilityScripts } from "@/components/ObservabilityScripts";
import { antinoou } from "@/lib/fonts";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";

export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LANGUAGE} suppressHydrationWarning>
      <body className={antinoou.variable}>
        <NotFoundAppFrame preferredLanguage={DEFAULT_LANGUAGE}>
          <NotFoundPage />
        </NotFoundAppFrame>
        <ObservabilityScripts />
      </body>
    </html>
  );
}
