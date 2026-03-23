type UserAppMetadata = {
  provider?: unknown;
  providers?: unknown;
} | null | undefined;

export type AccountAuthSettings = {
  authProviders: string[];
  canUpdatePassword: boolean;
  providerLabel: string;
};

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

function formatProviderLabel(provider: string) {
  if (provider === "google") {
    return "Google";
  }

  if (provider === "email") {
    return "email and password";
  }

  return provider;
}

export function getAccountAuthSettings(
  appMetadata: UserAppMetadata,
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
    providerLabel: formatProviderLabel(primaryProvider),
  };
}
