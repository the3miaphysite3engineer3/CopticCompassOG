import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/locale";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export default async function DashboardPage() {
  const preferredLanguage = await getPreferredLanguage();
  redirect(getDashboardPath(preferredLanguage));
}
