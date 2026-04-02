/* eslint-disable @next/next/no-img-element */
import { SurfacePanel } from "@/components/SurfacePanel";
import { antinoou } from "@/lib/fonts";
import type { Language } from "@/types/i18n";
import type { Tables } from "@/types/supabase";
import { getDashboardCopy } from "../lib/dashboardCopy";

export function DashboardWelcomePanel({
  locale,
  profile,
}: {
  locale: Language;
  profile: Tables<"profiles">;
}) {
  const copy = getDashboardCopy(locale);

  return (
    <SurfacePanel
      rounded="3xl"
      className="flex items-center justify-between p-6 md:p-8"
    >
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-stone-800 dark:text-stone-200">
          {copy.welcomeBack},{" "}
          {profile.full_name ? (
            <span className={`${antinoou.className} tracking-wide`}>
              {profile.full_name}
            </span>
          ) : (
            copy.fallbackStudentName
          )}
          !
        </h2>
        <p className="font-medium text-stone-600 dark:text-stone-400">
          {copy.loggedInAs}{" "}
          <span className="font-bold text-sky-600 dark:text-sky-400">
            {profile.email}
          </span>
        </p>
      </div>
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={copy.avatarAlt}
          className="hidden h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm md:block"
        />
      ) : null}
    </SurfacePanel>
  );
}
