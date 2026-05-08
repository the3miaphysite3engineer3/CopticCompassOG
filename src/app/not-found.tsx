import "@/app/globals.css";

import { NotFoundAppFrame } from "@/components/NotFoundAppFrame";
import { NotFoundPage } from "@/components/NotFoundPage";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";

export default function RootNotFound() {
  return (
    <NotFoundAppFrame preferredLanguage={DEFAULT_LANGUAGE}>
      <NotFoundPage />
    </NotFoundAppFrame>
  );
}
