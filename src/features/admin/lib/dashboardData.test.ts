import { describe, expect, it } from "vitest";
import {
  buildAdminAudienceMetrics,
  buildAdminNotificationMetrics,
} from "./dashboardData";

describe("admin dashboard data helpers", () => {
  it("builds audience metrics from subscription and sync state data", () => {
    expect(
      buildAdminAudienceMetrics([
        {
          books_opt_in: true,
          general_updates_opt_in: false,
          lessons_opt_in: true,
          syncState: {
            last_error: null,
            last_synced_at: "2025-01-01T00:00:00.000Z",
          },
        },
        {
          books_opt_in: false,
          general_updates_opt_in: true,
          lessons_opt_in: false,
          syncState: {
            last_error: "boom",
            last_synced_at: null,
          },
        },
        {
          books_opt_in: false,
          general_updates_opt_in: false,
          lessons_opt_in: false,
          syncState: null,
        },
      ]),
    ).toEqual({
      bookAudienceCount: 1,
      generalAudienceCount: 1,
      lessonAudienceCount: 1,
      resendSyncErrorCount: 1,
      resendSyncedAudienceCount: 1,
      subscribedAudienceContactsCount: 2,
      totalAudienceContactsCount: 3,
    });
  });

  it("builds notification metrics from status counts", () => {
    expect(
      buildAdminNotificationMetrics([
        { status: "failed" },
        { status: "sent" },
        { status: "sent" },
        { status: "queued" },
      ]),
    ).toEqual({
      failedNotificationCount: 1,
      recentNotificationCount: 4,
      sentNotificationCount: 2,
    });
  });
});
