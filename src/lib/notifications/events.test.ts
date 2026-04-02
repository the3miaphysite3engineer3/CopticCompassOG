import { beforeEach, describe, expect, it, vi } from "vitest";

type NotificationsEventsModuleContext = {
  createServiceRoleClientMock: ReturnType<typeof vi.fn>;
  dispatchLoggedNotificationEmail: typeof import("./events").dispatchLoggedNotificationEmail;
  dispatchLoggedOwnerAlertEmail: typeof import("./events").dispatchLoggedOwnerAlertEmail;
  getNotificationEmailEnvMock: ReturnType<typeof vi.fn>;
  hasSupabaseServiceRoleEnvMock: ReturnType<typeof vi.fn>;
  notificationDeliveriesInsertMock: ReturnType<typeof vi.fn>;
  notificationEventsInsertMock: ReturnType<typeof vi.fn>;
  notificationEventsUpdateEqMock: ReturnType<typeof vi.fn>;
  sendNotificationEmailMock: ReturnType<typeof vi.fn>;
};

async function loadNotificationsEventsModule(options?: {
  hasServiceRoleEnv?: boolean;
  notificationEmailEnv?: {
    notificationFromEmail: string;
    ownerAlertEmail: string | null;
    resendApiKey: string;
  } | null;
  sendNotificationResult?:
    | { error: string; success: false }
    | { id: string | null; success: true };
}) {
  vi.resetModules();

  const notificationEventsInsertMock = vi.fn().mockResolvedValue({
    data: { id: "event_123" },
    error: null,
  });
  const notificationDeliveriesInsertMock = vi.fn().mockResolvedValue({
    error: null,
  });
  const notificationEventsUpdateEqMock = vi.fn().mockResolvedValue({
    error: null,
  });
  const createServiceRoleClientMock = vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "notification_events") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: notificationEventsInsertMock,
            })),
          })),
          update: vi.fn(() => ({
            eq: notificationEventsUpdateEqMock,
          })),
        };
      }

      if (table === "notification_deliveries") {
        return {
          insert: notificationDeliveriesInsertMock,
        };
      }

      throw new Error(`Unexpected notification table: ${table}`);
    }),
  });
  const hasSupabaseServiceRoleEnvMock = vi
    .fn()
    .mockReturnValue(options?.hasServiceRoleEnv ?? true);
  const sendNotificationEmailMock = vi
    .fn()
    .mockResolvedValue(
      options?.sendNotificationResult ?? { success: true, id: "email_123" },
    );
  const getNotificationEmailEnvMock = vi.fn().mockReturnValue(
    options?.notificationEmailEnv ?? {
      notificationFromEmail: "notifications@example.com",
      ownerAlertEmail: "owner@example.com",
      resendApiKey: "re_123",
    },
  );

  vi.doMock("@/lib/notifications/config", () => ({
    getNotificationEmailEnv: getNotificationEmailEnvMock,
  }));
  vi.doMock("@/lib/notifications/email", () => ({
    sendNotificationEmail: sendNotificationEmailMock,
  }));
  vi.doMock("@/lib/supabase/config", () => ({
    hasSupabaseServiceRoleEnv: hasSupabaseServiceRoleEnvMock,
  }));
  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));

  const mod = await import("./events");

  return {
    ...mod,
    createServiceRoleClientMock,
    getNotificationEmailEnvMock,
    hasSupabaseServiceRoleEnvMock,
    notificationDeliveriesInsertMock,
    notificationEventsInsertMock,
    notificationEventsUpdateEqMock,
    sendNotificationEmailMock,
  } satisfies NotificationsEventsModuleContext;
}

describe("logged notification events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends email even when the service-role client is unavailable", async () => {
    const {
      createServiceRoleClientMock,
      dispatchLoggedNotificationEmail,
      notificationDeliveriesInsertMock,
      notificationEventsInsertMock,
      sendNotificationEmailMock,
    } = await loadNotificationsEventsModule({
      hasServiceRoleEnv: false,
    });

    await expect(
      dispatchLoggedNotificationEmail({
        aggregateId: "submission_123",
        aggregateType: "submission",
        eventType: "exercise_submission_received",
        subject: "New submission",
        text: "A new submission arrived.",
        to: "owner@example.com",
      }),
    ).resolves.toEqual({
      success: true,
      id: "email_123",
    });

    expect(createServiceRoleClientMock).not.toHaveBeenCalled();
    expect(notificationEventsInsertMock).not.toHaveBeenCalled();
    expect(notificationDeliveriesInsertMock).not.toHaveBeenCalled();
    expect(sendNotificationEmailMock).toHaveBeenCalledOnce();
  });

  it("stores the event and successful delivery when the email sends", async () => {
    const {
      dispatchLoggedNotificationEmail,
      notificationDeliveriesInsertMock,
      notificationEventsInsertMock,
      notificationEventsUpdateEqMock,
      sendNotificationEmailMock,
    } = await loadNotificationsEventsModule();

    await expect(
      dispatchLoggedNotificationEmail({
        aggregateId: "contact_123",
        aggregateType: "contact_message",
        eventType: "contact_message_received",
        payload: {
          inquiry_type: "publication_inquiry",
        },
        subject: "New contact",
        text: "A new contact message arrived.",
        to: "owner@example.com",
      }),
    ).resolves.toEqual({
      success: true,
      id: "email_123",
    });

    expect(notificationEventsInsertMock).toHaveBeenCalledOnce();
    expect(sendNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "New contact",
        to: "owner@example.com",
      }),
    );
    expect(notificationDeliveriesInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "event_123",
        provider_message_id: "email_123",
        recipient: "owner@example.com",
        status: "sent",
      }),
    );
    expect(notificationEventsUpdateEqMock).toHaveBeenCalledWith(
      "id",
      "event_123",
    );
  });

  it("stores a failed delivery when the email send fails", async () => {
    const {
      dispatchLoggedNotificationEmail,
      notificationDeliveriesInsertMock,
      sendNotificationEmailMock,
    } = await loadNotificationsEventsModule({
      sendNotificationResult: {
        success: false,
        error: "Provider unavailable",
      },
    });

    await expect(
      dispatchLoggedNotificationEmail({
        aggregateId: "submission_123",
        aggregateType: "submission",
        eventType: "submission_reviewed",
        subject: "Feedback ready",
        text: "Your feedback is ready.",
        to: "student@example.com",
      }),
    ).resolves.toEqual({
      success: false,
      error: "Provider unavailable",
    });

    expect(sendNotificationEmailMock).toHaveBeenCalledOnce();
    expect(notificationDeliveriesInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Provider unavailable",
        recipient: "student@example.com",
        status: "failed",
      }),
    );
  });

  it("uses the configured owner alert email for owner alerts", async () => {
    const {
      dispatchLoggedOwnerAlertEmail,
      getNotificationEmailEnvMock,
      sendNotificationEmailMock,
    } = await loadNotificationsEventsModule();

    await expect(
      dispatchLoggedOwnerAlertEmail({
        aggregateId: "report_123",
        aggregateType: "entry_report",
        eventType: "dictionary_entry_report_submitted",
        subject: "Report received",
        text: "A new dictionary report was submitted.",
      }),
    ).resolves.toEqual({
      success: true,
      id: "email_123",
    });

    expect(getNotificationEmailEnvMock).toHaveBeenCalledOnce();
    expect(sendNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
      }),
    );
  });
});
