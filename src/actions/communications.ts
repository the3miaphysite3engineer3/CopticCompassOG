"use server";

import { revalidatePath } from "next/cache";
import { syncAudienceContact } from "@/lib/communications/audience";
import { isLanguage, type Language } from "@/lib/i18n";
import { PUBLIC_LOCALES, getDashboardPath } from "@/lib/locale";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/config";
import { getProfile } from "@/lib/supabase/queries";
import { getFormString, normalizeWhitespace } from "@/lib/validation";

export type CommunicationPreferencesState = {
  message?: string;
  success: boolean;
};

const COMMUNICATION_ACTION_COPY: Record<
  Language,
  {
    authRequired: string;
    saveFailed: string;
    storageUnavailable: string;
    success: string;
  }
> = {
  en: {
    authRequired: "You must be logged in to update communication preferences.",
    saveFailed: "Could not update your communication preferences.",
    storageUnavailable:
      "Could not update your communication preferences right now. Please try again later.",
    success: "Communication preferences updated.",
  },
  nl: {
    authRequired:
      "Je moet ingelogd zijn om je communicatievoorkeuren bij te werken.",
    saveFailed: "Je communicatievoorkeuren konden niet worden bijgewerkt.",
    storageUnavailable:
      "Je communicatievoorkeuren konden nu niet worden bijgewerkt. Probeer het later opnieuw.",
    success: "Communicatievoorkeuren bijgewerkt.",
  },
};

function getActionLanguage(formData: FormData): Language {
  const rawLocale = normalizeWhitespace(getFormString(formData, "locale"));
  return isLanguage(rawLocale) ? rawLocale : "en";
}

function revalidateDashboardPaths() {
  revalidatePath("/dashboard");
  for (const locale of PUBLIC_LOCALES) {
    revalidatePath(getDashboardPath(locale));
  }
}

export async function updateCommunicationPreferences(
  formData: FormData,
): Promise<CommunicationPreferencesState> {
  const language = getActionLanguage(formData);
  const copy = COMMUNICATION_ACTION_COPY[language];

  if (!hasSupabaseServiceRoleEnv()) {
    return { success: false, message: copy.storageUnavailable };
  }

  const authContext = await getAuthenticatedServerContext();
  if (!authContext) {
    return { success: false, message: copy.authRequired };
  }

  const profile = await getProfile(authContext.supabase, authContext.user.id);
  const email = normalizeWhitespace(profile?.email ?? authContext.user.email ?? "");

  if (!email) {
    return { success: false, message: copy.saveFailed };
  }

  try {
    await syncAudienceContact({
      booksOptIn: formData.has("books_opt_in"),
      email,
      fullName: profile?.full_name ?? authContext.user.user_metadata?.full_name,
      generalUpdatesOptIn: formData.has("general_updates_opt_in"),
      lessonsOptIn: formData.has("lessons_opt_in"),
      locale: language,
      profileId: authContext.user.id,
      source: "dashboard",
    });

    revalidateDashboardPaths();
    revalidatePath("/admin");
    return { success: true, message: copy.success };
  } catch (error) {
    console.error("Failed to update communication preferences", error);
    return { success: false, message: copy.saveFailed };
  }
}
