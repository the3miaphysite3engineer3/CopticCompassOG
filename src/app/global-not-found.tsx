import "@/app/globals.css";

import { NotFoundAppFrame } from "@/components/NotFoundAppFrame";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ObservabilityScripts } from "@/components/ObservabilityScripts";
import { antinoou } from "@/lib/fonts";
import { getCspNonce } from "@/lib/server/csp";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export default async function GlobalNotFound() {
  const [preferredLanguage, nonce] = await Promise.all([
    getPreferredLanguage(),
    getCspNonce(),
  ]);

  return (
    <html lang={preferredLanguage} suppressHydrationWarning>
      <body className={antinoou.variable}>
        <NotFoundAppFrame nonce={nonce} preferredLanguage={preferredLanguage}>
          <NotFoundPage />
        </NotFoundAppFrame>
        <ObservabilityScripts />
      </body>
    </html>
  );
}
