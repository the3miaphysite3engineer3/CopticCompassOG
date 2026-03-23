import { permanentRedirect } from "next/navigation";
import { getPublicationPath } from "@/features/publications/lib/publications";

export default async function LegacyPublicationDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(getPublicationPath(id, "en"));
}
