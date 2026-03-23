import { permanentRedirect } from "next/navigation";
import { getEntryPath } from "@/lib/locale";

export default async function LegacyEntryRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(getEntryPath(id, "en"));
}
