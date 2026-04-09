import type { Language } from "@/types/i18n";

type UserAppMetadata =
  | {
      provider?: unknown;
      providers?: unknown;
    }
  | null
  | undefined;

interface AccountAuthSettings {
  authProviders: string[];
  canUpdatePassword: boolean;
  providerLabel: string;
}

/**
 * Normalizes the auth providers reported by Supabase into a unique list that
 * the account settings UI can reason about.
 */
function normalizeAuthProviders(appMetadata: UserAppMetadata) {
  const providers = Array.isArray(appMetadata?.providers)
    ? appMetadata.providers
    : [appMetadata?.provider];

  return Array.from(
    new Set(
      providers.filter(
        (provider): provider is string =>
          typeof provider === "string" && provider.length > 0,
      ),
    ),
  );
}

/**
 * Formats the primary sign-in method for the account settings panel.
 */
function formatProviderLabel(provider: string, language: Language) {
  if (provider === "google") {
    return "Google";
  }

  if (provider === "email") {
    return language === "nl" ? "e-mail en wachtwoord" : "email and password";
  }

  return provider;
}

/**
 * Derives the account-auth settings shown in the profile UI, including whether
 * password updates are supported for the current provider mix.
 */
export function getAccountAuthSettings(
  appMetadata: UserAppMetadata,
  language: Language = "en",
): AccountAuthSettings {
  const authProviders = normalizeAuthProviders(appMetadata);
  const canUpdatePassword =
    authProviders.length === 0 || authProviders.includes("email");
  const primaryProvider =
    authProviders.find((provider) => provider !== "email") ??
    authProviders[0] ??
    "email";

  return {
    authProviders,
    canUpdatePassword,
    providerLabel: formatProviderLabel(primaryProvider, language),
  };
}
