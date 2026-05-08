import { NotFoundPage } from "@/components/NotFoundPage";

/**
 * Keeps localized 404s inside the static public site layout. The layout already
 * provides the locale-aware app frame, so this page does not need to read
 * request cookies or headers.
 */
export default function LocalizedNotFound() {
  return <NotFoundPage />;
}
