import { describe, expect, it } from "vitest";
import {
  buildProfileSignupNotificationDedupeKey,
  buildProfileSignupNotificationPayload,
  buildProfileSignupOwnerAlert,
  parseProfileSignupPayload,
} from "../../../supabase/functions/_shared/profileSignupAlert";

describe("profile signup alert helpers", () => {
  it("parses profile insert webhook payloads", () => {
    expect(
      parseProfileSignupPayload({
        old_record: null,
        record: {
          created_at: "2026-03-28T12:00:00.000Z",
          email: "student@example.com",
          full_name: "Test Student",
          id: "11111111-1111-4111-8111-111111111111",
        },
        schema: "public",
        table: "profiles",
        type: "INSERT",
      }),
    ).toEqual({
      createdAt: "2026-03-28T12:00:00.000Z",
      email: "student@example.com",
      fullName: "Test Student",
      id: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("ignores non-profile insert payloads", () => {
    expect(
      parseProfileSignupPayload({
        old_record: null,
        record: {
          id: "11111111-1111-4111-8111-111111111111",
        },
        schema: "public",
        table: "profiles",
        type: "UPDATE",
      }),
    ).toBeNull();
  });

  it("builds an owner alert with sensible fallbacks", () => {
    expect(
      buildProfileSignupOwnerAlert({
        createdAt: null,
        email: null,
        fullName: null,
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({
      subject: "New user signup: 11111111-1111-4111-8111-111111111111",
      text: [
        "A new user account has been created.",
        "",
        "Profile ID: 11111111-1111-4111-8111-111111111111",
        "Email: Not provided",
        "Full name: Not provided",
        "Created at: Unknown timestamp",
      ].join("\n"),
    });
  });

  it("builds notification payload metadata and a stable dedupe key", () => {
    expect(
      buildProfileSignupNotificationPayload({
        createdAt: "2026-03-28T12:00:00.000Z",
        email: "student@example.com",
        fullName: "Test Student",
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({
      created_at: "2026-03-28T12:00:00.000Z",
      profile_email: "st***@example.com",
      profile_full_name: "Test Student",
    });

    expect(
      buildProfileSignupNotificationDedupeKey({
        createdAt: null,
        email: null,
        fullName: null,
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("profile_signup:11111111-1111-4111-8111-111111111111");
  });
});
