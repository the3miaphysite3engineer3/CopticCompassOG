import "@/app/globals.css";

import { NotFoundAppFrame } from "@/components/NotFoundAppFrame";
import { NotFoundPage } from "@/components/NotFoundPage";
import { getCspNonce } from "@/lib/server/csp";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export default async function RootNotFound() {
  const [preferredLanguage, nonce] = await Promise.all([
    getPreferredLanguage(),
    getCspNonce(),
  ]);

  return (
    <NotFoundAppFrame nonce={nonce} preferredLanguage={preferredLanguage}>
      <NotFoundPage />
    </NotFoundAppFrame>
  );
}
