import { redirect } from "next/navigation";
import { getPublicationPath } from "@/features/publications/lib/publications";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export default async function LegacyPublicationDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preferredLanguage = await getPreferredLanguage();
  redirect(getPublicationPath(id, preferredLanguage));
}
