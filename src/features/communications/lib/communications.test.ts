import { describe, expect, it } from "vitest";

import {
  compareAudienceContactPriority,
  getAudiencePreferences,
  hasAudienceSubscriptions,
} from "./communications";

describe("audience communication helpers", () => {
  it("falls back to the requested locale when no contact exists", () => {
    expect(getAudiencePreferences(null, "nl")).toEqual({
      booksOptIn: false,
      generalUpdatesOptIn: false,
      lessonsOptIn: false,
      locale: "nl",
    });
  });

  it("detects active subscriptions from database-style rows", () => {
    expect(
      hasAudienceSubscriptions({
        books_opt_in: false,
        general_updates_opt_in: true,
        lessons_opt_in: false,
      }),
    ).toBe(true);
  });

  it("sorts active contacts ahead of paused ones", () => {
    type AudienceContactArgument = Parameters<
      typeof compareAudienceContactPriority
    >[0];
    const activeContact = {
      books_opt_in: false,
      general_updates_opt_in: true,
      id: "1",
      lessons_opt_in: false,
      updated_at: "2026-03-28T12:00:00.000Z",
    } as AudienceContactArgument;
    const pausedContact = {
      books_opt_in: false,
      general_updates_opt_in: false,
      id: "2",
      lessons_opt_in: false,
      updated_at: "2026-03-28T13:00:00.000Z",
    } as AudienceContactArgument;

    expect(
      compareAudienceContactPriority(activeContact, pausedContact),
    ).toBeLessThan(0);
  });
});
