import { hasAudienceSubscriptions } from "@/features/communications/lib/communications";
import { syncStoredAudienceContactToResend } from "@/lib/communications/resend";
import { isLanguage, type Language } from "@/lib/i18n";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { normalizeWhitespace } from "@/lib/validation";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

type AudienceContactInsert = TablesInsert<"audience_contacts">;

export type SyncAudienceContactInput = {
  booksOptIn: boolean;
  email: string;
  fullName?: string | null;
  generalUpdatesOptIn: boolean;
  lessonsOptIn: boolean;
  locale?: Language | null;
  profileId?: string | null;
  source: AudienceContactInsert["source"];
};

function normalizeAudienceFullName(value?: string | null) {
  const normalized = normalizeWhitespace(value ?? "");
  return normalized.length > 0 ? normalized : null;
}

function normalizeAudienceEmail(email: string) {
  return normalizeWhitespace(email).toLowerCase();
}

function normalizeAudienceLocale(locale?: Language | null) {
  return locale && isLanguage(locale) ? locale : "en";
}

export async function syncAudienceContact({
  booksOptIn,
  email,
  fullName,
  generalUpdatesOptIn,
  lessonsOptIn,
  locale,
  profileId,
  source,
}: SyncAudienceContactInput) {
  const normalizedEmail = normalizeAudienceEmail(email);
  const normalizedFullName = normalizeAudienceFullName(fullName);
  const normalizedLocale = normalizeAudienceLocale(locale);

  const supabase = createServiceRoleClient();
  const { data: existingContact, error: existingContactError } = await supabase
    .from("audience_contacts")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingContactError) {
    throw new Error(existingContactError.message);
  }

  const nextPreferences = {
    booksOptIn,
    generalUpdatesOptIn,
    lessonsOptIn,
    locale: normalizedLocale,
  };
  const nextIsSubscribed = hasAudienceSubscriptions(nextPreferences);
  const now = new Date().toISOString();

  const payload = {
    books_opt_in: booksOptIn,
    consented_at: nextIsSubscribed
      ? (existingContact?.consented_at ?? now)
      : (existingContact?.consented_at ?? null),
    email: normalizedEmail,
    full_name: normalizedFullName ?? existingContact?.full_name ?? null,
    general_updates_opt_in: generalUpdatesOptIn,
    lessons_opt_in: lessonsOptIn,
    locale: normalizedLocale,
    profile_id: profileId ?? existingContact?.profile_id ?? null,
    source,
    unsubscribed_at: nextIsSubscribed ? null : now,
    updated_at: now,
  } satisfies TablesUpdate<"audience_contacts">;

  if (existingContact) {
    const { data, error } = await supabase
      .from("audience_contacts")
      .update(payload)
      .eq("id", existingContact.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    try {
      const resendSyncResult = await syncStoredAudienceContactToResend(
        data,
        supabase,
      );
      if (!resendSyncResult.success) {
        console.error("Failed to sync audience contact to Resend", {
          audienceContactId: data.id,
          email: data.email,
          error: resendSyncResult.error,
        });
      }

      return resendSyncResult.contact;
    } catch (error) {
      console.error("Unexpected audience contact sync failure", {
        audienceContactId: data.id,
        email: data.email,
        error,
      });
      return data;
    }
  }

  const { data, error } = await supabase
    .from("audience_contacts")
    .insert({
      ...payload,
      created_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    const resendSyncResult = await syncStoredAudienceContactToResend(
      data,
      supabase,
    );
    if (!resendSyncResult.success) {
      console.error("Failed to sync audience contact to Resend", {
        audienceContactId: data.id,
        email: data.email,
        error: resendSyncResult.error,
      });
    }

    return resendSyncResult.contact;
  } catch (error) {
    console.error("Unexpected audience contact sync failure", {
      audienceContactId: data.id,
      email: data.email,
      error,
    });
    return data;
  }
}
