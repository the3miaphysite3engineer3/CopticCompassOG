import { beforeEach, describe, expect, it, vi } from "vitest";

type ContactModuleContext = {
  buildAudienceOptInConfirmationUrlMock: ReturnType<typeof vi.fn>;
  consumeRateLimitMock: ReturnType<typeof vi.fn>;
  createAudienceOptInRequestMock: ReturnType<typeof vi.fn>;
  createServiceRoleClientMock: ReturnType<typeof vi.fn>;
  dispatchLoggedNotificationEmailMock: ReturnType<typeof vi.fn>;
  getClientRateLimitIdentifierMock: ReturnType<typeof vi.fn>;
  hasSupabaseServiceRoleEnvMock: ReturnType<typeof vi.fn>;
  insertMock: ReturnType<typeof vi.fn>;
  insertSingleMock: ReturnType<typeof vi.fn>;
  sendContactEmail: typeof import("./contact").sendContactEmail;
};

const ORIGINAL_ENV = {
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
};

function createContactFormData(
  overrides?: Partial<
    Record<
      "email" | "inquiryType" | "locale" | "message" | "name" | "website",
      string
    > & { wantsUpdates: boolean }
  >,
) {
  const formData = new FormData();
  formData.set("name", overrides?.name ?? "Kyrillos Wannes");
  formData.set("email", overrides?.email ?? "sender@example.com");
  formData.set("inquiryType", overrides?.inquiryType ?? "dictionary_feedback");
  formData.set("locale", overrides?.locale ?? "en");
  formData.set("message", overrides?.message ?? "Hello from the test suite.");

  if (overrides?.website !== undefined) {
    formData.set("website", overrides.website);
  }

  if (overrides?.wantsUpdates) {
    formData.set("wants_updates", "true");
  }

  return formData;
}

async function loadContactModule(options?: {
  contactEmail?: string | null;
  hasStorageEnv?: boolean;
  insertError?: {
    code?: string;
    details?: string | null;
    hint?: string | null;
    message?: string;
  } | null;
  notificationResult?: { error: string; success: false } | { id: string | null; success: true };
  rateLimitOk?: boolean;
}) {
  vi.resetModules();

  if (options?.contactEmail === null) {
    delete process.env.CONTACT_EMAIL;
  } else {
    process.env.CONTACT_EMAIL = options?.contactEmail ?? "owner@example.com";
  }

  const consumeRateLimitMock = vi.fn().mockResolvedValue({
    ok: options?.rateLimitOk ?? true,
    remaining: 1,
    resetAt: Date.now() + 60_000,
    retryAfterMs: 60_000,
  });
  const getClientRateLimitIdentifierMock = vi
    .fn()
    .mockResolvedValue("client-fingerprint");
  const insertSingleMock = vi.fn().mockResolvedValue({
    data: { id: "contact_123" },
    error: options?.insertError ?? null,
  });
  const insertMock = vi.fn(() => ({
    select: vi.fn(() => ({
      single: insertSingleMock,
    })),
  }));
  const createServiceRoleClientMock = vi.fn().mockReturnValue({
    from: vi.fn(() => ({
      insert: insertMock,
    })),
  });
  const buildAudienceOptInConfirmationUrlMock = vi
    .fn()
    .mockReturnValue("https://example.com/en/communications/confirm?token=test-token");
  const createAudienceOptInRequestMock = vi.fn().mockResolvedValue({
    request: {
      id: "opt_in_123",
    },
    token: "test-token",
  });
  const hasSupabaseServiceRoleEnvMock = vi
    .fn()
    .mockReturnValue(options?.hasStorageEnv ?? true);
  const dispatchLoggedNotificationEmailMock = vi
    .fn()
    .mockResolvedValue(options?.notificationResult ?? { success: true, id: "email_123" });

  vi.doMock("@/lib/rateLimit", () => ({
    consumeRateLimit: consumeRateLimitMock,
    getClientRateLimitIdentifier: getClientRateLimitIdentifierMock,
  }));
  vi.doMock("@/lib/supabase/config", () => ({
    hasSupabaseServiceRoleEnv: hasSupabaseServiceRoleEnvMock,
  }));
  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));
  vi.doMock("@/lib/communications/optInRequests", () => ({
    buildAudienceOptInConfirmationUrl: buildAudienceOptInConfirmationUrlMock,
    createAudienceOptInRequest: createAudienceOptInRequestMock,
  }));
  vi.doMock("@/lib/notifications/events", () => ({
    dispatchLoggedNotificationEmail: dispatchLoggedNotificationEmailMock,
  }));

  const mod = await import("./contact");

  return {
    ...mod,
    buildAudienceOptInConfirmationUrlMock,
    consumeRateLimitMock,
    createAudienceOptInRequestMock,
    createServiceRoleClientMock,
    dispatchLoggedNotificationEmailMock,
    getClientRateLimitIdentifierMock,
    hasSupabaseServiceRoleEnvMock,
    insertMock,
    insertSingleMock,
  } satisfies ContactModuleContext;
}

describe("contact action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTACT_EMAIL = ORIGINAL_ENV.CONTACT_EMAIL;
  });

  it("returns a configuration error when contact storage is unavailable", async () => {
    const { createServiceRoleClientMock, sendContactEmail } =
      await loadContactModule({ hasStorageEnv: false });

    await expect(sendContactEmail(null, createContactFormData())).resolves.toEqual({
      success: false,
      error: "Contact form storage is not configured yet.",
    });

    expect(createServiceRoleClientMock).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without storing or notifying", async () => {
    const {
      createServiceRoleClientMock,
      dispatchLoggedNotificationEmailMock,
      sendContactEmail,
    } =
      await loadContactModule();

    await expect(
      sendContactEmail(
        null,
        createContactFormData({ website: "https://spam.example" }),
      ),
    ).resolves.toEqual({
      success: true,
    });

    expect(createServiceRoleClientMock).not.toHaveBeenCalled();
    expect(dispatchLoggedNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("rejects invalid contact payloads before rate limiting or storing", async () => {
    const {
      consumeRateLimitMock,
      dispatchLoggedNotificationEmailMock,
      insertMock,
      sendContactEmail,
    } =
      await loadContactModule();

    await expect(
      sendContactEmail(
        null,
        createContactFormData({
          email: "invalid",
          inquiryType: "not-allowed",
          message: "bad",
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "Please complete all fields with valid values.",
    });

    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(dispatchLoggedNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("returns a friendly error when contact submissions are rate limited", async () => {
    const {
      dispatchLoggedNotificationEmailMock,
      insertMock,
      sendContactEmail,
    } =
      await loadContactModule({
        rateLimitOk: false,
      });

    await expect(sendContactEmail(null, createContactFormData())).resolves.toEqual({
      success: false,
      error:
        "Too many messages were sent from this connection. Please wait a few minutes and try again.",
    });

    expect(insertMock).not.toHaveBeenCalled();
    expect(dispatchLoggedNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("returns a configuration error when the contact_messages table is unavailable", async () => {
    const {
      dispatchLoggedNotificationEmailMock,
      sendContactEmail,
    } = await loadContactModule({
      insertError: {
        code: "42P01",
        message: 'relation "contact_messages" does not exist',
      },
    });

    await expect(sendContactEmail(null, createContactFormData())).resolves.toEqual({
      success: false,
      error: "Contact form storage is not configured yet.",
    });

    expect(dispatchLoggedNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("stores normalized contact messages and sends both the owner alert and update confirmation request", async () => {
    const {
      buildAudienceOptInConfirmationUrlMock,
      createAudienceOptInRequestMock,
      dispatchLoggedNotificationEmailMock,
      insertMock,
      sendContactEmail,
    } =
      await loadContactModule();

    await expect(
      sendContactEmail(
        null,
        createContactFormData({
          email: " SENDER@Example.com ",
          inquiryType: "publication_inquiry",
          locale: "nl",
          message: "Hello\n\n  Kyrillos  ",
          name: "  Test User  ",
          wantsUpdates: true,
        }),
      ),
    ).resolves.toEqual({
      success: true,
      message:
        "Bericht succesvol verzonden. Controleer je inbox om e-mailupdates te bevestigen.",
    });

    expect(insertMock).toHaveBeenCalledWith({
      email: "sender@example.com",
      inquiry_type: "publication_inquiry",
      locale: "nl",
      message: "Hello\n\nKyrillos",
      name: "Test User",
      wants_updates: true,
    });
    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: "contact_123",
        aggregateType: "contact_message",
        eventType: "contact_message_received",
        replyTo: "sender@example.com",
        subject: "New Contact: Publication / Book Inquiry from Test User",
        text: expect.stringContaining("Wants updates: yes"),
        to: "owner@example.com",
      }),
    );
    expect(createAudienceOptInRequestMock).toHaveBeenCalledWith({
      booksRequested: true,
      email: "sender@example.com",
      fullName: "Test User",
      generalUpdatesRequested: true,
      lessonsRequested: true,
      locale: "nl",
      source: "contact_form",
    });
    expect(buildAudienceOptInConfirmationUrlMock).toHaveBeenCalledWith(
      "nl",
      "test-token",
    );
    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: "opt_in_123",
        aggregateType: "audience_opt_in_request",
        eventType: "audience_opt_in_requested",
        subject: "Bevestig je e-mailupdates",
        to: "sender@example.com",
        text: expect.stringContaining("https://example.com/en/communications/confirm?token=test-token"),
      }),
    );
  });

  it("returns success even if the owner alert email fails after the message is stored", async () => {
    const {
      dispatchLoggedNotificationEmailMock,
      insertMock,
      sendContactEmail,
    } =
      await loadContactModule({
        notificationResult: {
          success: false,
          error: "Domain not verified",
        },
      });

    await expect(sendContactEmail(null, createContactFormData())).resolves.toEqual({
      success: true,
      message: "Message sent successfully. I'll reply soon!",
    });

    expect(insertMock).toHaveBeenCalledOnce();
    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledOnce();
  });

  it("keeps the inquiry successful even if the update confirmation email cannot be sent", async () => {
    const {
      dispatchLoggedNotificationEmailMock,
      sendContactEmail,
    } = await loadContactModule();

    dispatchLoggedNotificationEmailMock
      .mockResolvedValueOnce({ success: true, id: "owner_email_1" })
      .mockResolvedValueOnce({
        success: false,
        error: "Provider unavailable",
      });

    await expect(
      sendContactEmail(null, createContactFormData({ wantsUpdates: true })),
    ).resolves.toEqual({
      success: true,
      message:
        "Message sent successfully, but I could not send the update confirmation email just now.",
    });

    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledTimes(2);
  });
});
