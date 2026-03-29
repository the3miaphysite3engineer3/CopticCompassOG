import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const getNotificationEmailEnvMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: sendMock,
    };
  },
}));

vi.mock("@/lib/notifications/config", () => ({
  getNotificationEmailEnv: getNotificationEmailEnvMock,
}));

describe("notification email helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNotificationEmailEnvMock.mockReturnValue({
      resendApiKey: "test-resend-key",
      ownerAlertEmail: "owner@example.com",
      notificationFromEmail: "notifications@example.com",
    });
  });

  it("returns a configuration error when notification env vars are missing", async () => {
    getNotificationEmailEnvMock.mockReturnValue(null);

    const { sendNotificationEmail } = await import("./email");

    await expect(
      sendNotificationEmail({
        subject: "Test subject",
        text: "Test body",
        to: "student@example.com",
      }),
    ).resolves.toEqual({
      success: false,
      error: "Notification email service is not configured.",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("uses the configured default sender and normalizes single recipients", async () => {
    sendMock.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    });

    const { sendNotificationEmail } = await import("./email");

    await expect(
      sendNotificationEmail({
        subject: "Exercise reviewed",
        text: "Your exercise has been graded.",
        to: "student@example.com",
        replyTo: "teacher@example.com",
      }),
    ).resolves.toEqual({
      success: true,
      id: "email_123",
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: "notifications@example.com",
      replyTo: ["teacher@example.com"],
      subject: "Exercise reviewed",
      text: "Your exercise has been graded.",
      to: ["student@example.com"],
    });
  });

  it("sends owner alerts to the configured owner inbox", async () => {
    sendMock.mockResolvedValue({
      data: { id: "email_456" },
      error: null,
    });

    const { sendOwnerAlertEmail } = await import("./email");

    await expect(
      sendOwnerAlertEmail({
        subject: "New signup",
        text: "A new student account was created.",
      }),
    ).resolves.toEqual({
      success: true,
      id: "email_456",
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: "notifications@example.com",
      subject: "New signup",
      text: "A new student account was created.",
      to: ["owner@example.com"],
    });
  });

  it("returns a friendly failure when Resend responds with an error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        message: "Domain not verified",
      },
    });

    const { sendNotificationEmail } = await import("./email");

    await expect(
      sendNotificationEmail({
        subject: "Test subject",
        text: "Test body",
        to: "student@example.com",
      }),
    ).resolves.toEqual({
      success: false,
      error: "Domain not verified",
    });
  });
});
