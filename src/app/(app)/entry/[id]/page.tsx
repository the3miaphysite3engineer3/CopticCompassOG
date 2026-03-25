import { redirect } from "next/navigation";
import { getEntryPath } from "@/lib/locale";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export default async function LegacyEntryRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preferredLanguage = await getPreferredLanguage();
  redirect(getEntryPath(id, preferredLanguage));
}
