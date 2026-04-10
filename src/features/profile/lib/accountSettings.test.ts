import { describe, expect, it } from "vitest";

import { getAccountAuthSettings } from "./accountSettings";

describe("account settings auth state", () => {
  it("treats missing provider metadata as email-password access", () => {
    expect(getAccountAuthSettings(undefined)).toEqual({
      authProviders: [],
      canUpdatePassword: true,
      providerLabel: "email and password",
    });
  });

  it("allows password updates when email is one of the linked providers", () => {
    expect(
      getAccountAuthSettings({
        providers: ["google", "email"],
      }),
    ).toEqual({
      authProviders: ["google", "email"],
      canUpdatePassword: true,
      providerLabel: "Google",
    });
  });

  it("marks password updates unavailable for external-only providers", () => {
    expect(
      getAccountAuthSettings({
        provider: "google",
      }),
    ).toEqual({
      authProviders: ["google"],
      canUpdatePassword: false,
      providerLabel: "Google",
    });
  });
});
