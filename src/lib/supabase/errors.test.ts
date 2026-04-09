import { describe, expect, it } from "vitest";

import { isMissingSupabaseTableError } from "./errors";

describe("isMissingSupabaseTableError", () => {
  it("detects known missing-table error codes", () => {
    expect(isMissingSupabaseTableError({ code: "PGRST205" })).toBe(true);
    expect(isMissingSupabaseTableError({ code: "42P01" })).toBe(true);
  });

  it("detects known missing-table error messages", () => {
    expect(
      isMissingSupabaseTableError({
        message:
          'Could not find the table "contact_messages" in the schema cache',
      }),
    ).toBe(true);
    expect(
      isMissingSupabaseTableError({
        message: 'relation "lesson_progress" does not exist',
      }),
    ).toBe(true);
  });

  it("ignores unrelated Supabase errors", () => {
    expect(
      isMissingSupabaseTableError({
        code: "42501",
        message: "new row violates row-level security policy",
      }),
    ).toBe(false);
    expect(isMissingSupabaseTableError(null)).toBe(false);
  });
});
