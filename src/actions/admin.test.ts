import { beforeEach, describe, expect, it, vi } from "vitest";

type AdminModuleContext = {
  contactUpdateEqMock: ReturnType<typeof vi.fn>;
  contentReleaseItemInsertMock: ReturnType<typeof vi.fn>;
  contentReleaseUpdateEqMock: ReturnType<typeof vi.fn>;
  createContentReleaseDraft: typeof import("./admin").createContentReleaseDraft;
  dispatchLoggedNotificationEmailMock: ReturnType<typeof vi.fn>;
  getAdminServerContextMock: ReturnType<typeof vi.fn>;
  invokeSupabaseEdgeFunctionMock: ReturnType<typeof vi.fn>;
  sendContentReleasePreview: typeof import("./admin").sendContentReleasePreview;
  sendContentRelease: typeof import("./admin").sendContentRelease;
  profileMaybeSingleMock: ReturnType<typeof vi.fn>;
  revalidatePathMock: ReturnType<typeof vi.fn>;
  reportUpdateEqMock: ReturnType<typeof vi.fn>;
  submissionSelectMock: ReturnType<typeof vi.fn>;
  submissionUpdateEqMock: ReturnType<typeof vi.fn>;
  submissionUpdateMock: ReturnType<typeof vi.fn>;
  submitFeedback: typeof import("./admin").submitFeedback;
  syncAudienceContactsWithResend: typeof import("./admin").syncAudienceContactsWithResend;
  syncStoredAudienceContactToResendMock: ReturnType<typeof vi.fn>;
  updateContentReleaseStatus: typeof import("./admin").updateContentReleaseStatus;
  updateContactMessageStatus: typeof import("./admin").updateContactMessageStatus;
  updateEntryReportStatus: typeof import("./admin").updateEntryReportStatus;
};

function createAdminFormData(
  overrides?: Partial<Record<"feedback" | "rating" | "submission_id", string>>,
) {
  const formData = new FormData();
  formData.set(
    "submission_id",
    overrides?.submission_id ?? "11111111-1111-4111-8111-111111111111",
  );
  formData.set("rating", overrides?.rating ?? "5");
  formData.set("feedback", overrides?.feedback ?? "Well done.");
  return formData;
}

function createEntryReportAdminFormData(
  overrides?: Partial<Record<"report_id" | "status", string>>,
) {
  const formData = new FormData();
  formData.set(
    "report_id",
    overrides?.report_id ?? "22222222-2222-4222-8222-222222222222",
  );
  formData.set("status", overrides?.status ?? "reviewed");
  return formData;
}

function createContactMessageAdminFormData(
  overrides?: Partial<Record<"contact_message_id" | "status", string>>,
) {
  const formData = new FormData();
  formData.set(
    "contact_message_id",
    overrides?.contact_message_id ?? "33333333-3333-4333-8333-333333333333",
  );
  formData.set("status", overrides?.status ?? "answered");
  return formData;
}

function createContentReleaseDraftFormData(
  overrides?: Partial<
    Record<
      | "audience_segment"
      | "body_en"
      | "body_nl"
      | "locale_mode"
      | "subject_en"
      | "subject_nl",
      string
    > & {
      releaseItems: string[];
    }
  >,
) {
  const formData = new FormData();
  formData.set("audience_segment", overrides?.audience_segment ?? "lessons");
  formData.set("locale_mode", overrides?.locale_mode ?? "localized");
  formData.set("subject_en", overrides?.subject_en ?? "New lesson available");
  formData.set("subject_nl", overrides?.subject_nl ?? "Nieuwe les beschikbaar");
  formData.set(
    "body_en",
    overrides?.body_en ?? "A new lesson has been published.",
  );
  formData.set(
    "body_nl",
    overrides?.body_nl ?? "Er is een nieuwe les gepubliceerd.",
  );

  for (const releaseItem of overrides?.releaseItems ?? ["lesson:lesson-1"]) {
    formData.append("release_item", releaseItem);
  }

  return formData;
}

function createContentReleaseStatusFormData(
  overrides?: Partial<Record<"release_id" | "status", string>>,
) {
  const formData = new FormData();
  formData.set(
    "release_id",
    overrides?.release_id ?? "44444444-4444-4444-8444-444444444444",
  );
  formData.set("status", overrides?.status ?? "approved");
  return formData;
}

async function loadAdminModule(options?: {
  audienceContacts?: {
    books_opt_in: boolean;
    consented_at: string | null;
    created_at: string;
    email: string;
    full_name: string | null;
    general_updates_opt_in: boolean;
    id: string;
    lessons_opt_in: boolean;
    locale: "en" | "nl";
    profile_id: string | null;
    source: "contact_form" | "dashboard" | "signup";
    unsubscribed_at: string | null;
    updated_at: string;
  }[];
  contactUpdateError?: { message?: string } | null;
  existingReleaseEvents?: {
    payload?: object | null;
    recipient: string;
    status?: string;
  }[];
  contentReleaseInsertError?: { message?: string } | null;
  contentReleaseItems?: {
    created_at?: string;
    id?: string;
    item_id: string;
    item_type: "lesson" | "publication";
    release_id: string;
    title_snapshot: string;
    url_snapshot: string;
  }[];
  contentReleaseItemsInsertError?: { message?: string } | null;
  contentReleaseUpdateError?: { message?: string } | null;
  feedbackNotificationResult?:
    | { error: string; success: false }
    | { id: string | null; success: true };
  hasEnv?: boolean;
  hasResendAudienceEnv?: boolean;
  invokeWorkerResult?:
    | { data?: Record<string, unknown> | null; status: number; success: true }
    | { error: string; status: number; success: false };
  isAdmin?: boolean;
  profile?: { email: string | null; full_name: string | null } | null;
  reportUpdateError?: { message?: string } | null;
  release?: {
    audience_segment: "books" | "general" | "lessons";
    body_en: string | null;
    body_nl: string | null;
    created_at: string;
    delivery_cursor: string | null;
    delivery_finished_at: string | null;
    delivery_requested_at: string | null;
    delivery_requested_by: string | null;
    delivery_started_at: string | null;
    delivery_summary: Record<string, unknown>;
    id: string;
    last_delivery_error: string | null;
    locale_mode: "en_only" | "localized" | "nl_only";
    release_type: "lesson" | "mixed" | "publication";
    sent_at: string | null;
    status: "approved" | "cancelled" | "draft" | "queued" | "sending" | "sent";
    subject_en: string | null;
    subject_nl: string | null;
    updated_at: string;
  } | null;
  releaseNotificationResult?:
    | { error: string; success: false }
    | { id: string | null; success: true };
  resendAudienceSyncResult?:
    | {
        contact: Record<string, unknown>;
        success: true;
        syncState?: Record<string, unknown> | null;
      }
    | {
        contact: Record<string, unknown>;
        error: string;
        success: false;
        syncState?: Record<string, unknown> | null;
      };
  submission?: {
    exercise_id: string | null;
    lesson_slug: string;
    rating: number | null;
    submitted_language: "en" | "nl" | null;
    user_id: string;
  } | null;
  submissionUpdateError?: { message?: string } | null;
  user?: { id: string } | null;
}) {
  vi.resetModules();

  const revalidatePathMock = vi.fn();
  const submissionUpdateEqMock = vi.fn().mockResolvedValue({
    error: options?.submissionUpdateError ?? null,
  });
  const reportUpdateEqMock = vi.fn().mockResolvedValue({
    error: options?.reportUpdateError ?? null,
  });
  const contactUpdateEqMock = vi.fn().mockResolvedValue({
    error: options?.contactUpdateError ?? null,
  });
  const contentReleaseUpdateEqMock = vi.fn().mockResolvedValue({
    error: options?.contentReleaseUpdateError ?? null,
  });
  const submissionUpdateMock = vi.fn(() => ({
    eq: submissionUpdateEqMock,
  }));
  const contentReleaseSingleMock = vi.fn().mockResolvedValue({
    data: { id: "release_123" },
    error: options?.contentReleaseInsertError ?? null,
  });
  const contentReleaseInsertMock = vi.fn(() => ({
    select: vi.fn(() => ({
      single: contentReleaseSingleMock,
    })),
  }));
  const contentReleaseItemInsertMock = vi.fn().mockResolvedValue({
    error: options?.contentReleaseItemsInsertError ?? null,
  });
  const submissionMaybeSingleMock = vi.fn().mockResolvedValue({
    data: options?.submission ?? {
      exercise_id: "grammar.exercise.lesson01.001",
      lesson_slug: "lesson-1",
      rating: 5,
      submitted_language: "en",
      user_id: "student_123",
    },
    error: null,
  });
  const submissionSelectMock = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: submissionMaybeSingleMock,
    })),
  }));
  const profileMaybeSingleMock = vi.fn().mockResolvedValue({
    data: options?.profile ?? {
      email: "student@example.com",
      full_name: "Test Student",
    },
    error: null,
  });
  const profileSelectMock = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: profileMaybeSingleMock,
    })),
  }));
  const dispatchLoggedNotificationEmailMock = vi
    .fn()
    .mockImplementation((payload: { aggregateType?: string }) =>
      Promise.resolve(
        payload.aggregateType === "content_release"
          ? (options?.releaseNotificationResult ?? {
              success: true,
              id: "email_789",
            })
          : (options?.feedbackNotificationResult ?? {
              success: true,
              id: "email_123",
            }),
      ),
    );
  const getNotificationEmailEnvMock = vi.fn().mockReturnValue({
    notificationFromEmail: "notifications@example.com",
    ownerAlertEmail: "owner@example.com",
    resendApiKey: "re_123",
  });
  const invokeSupabaseEdgeFunctionMock = vi.fn().mockResolvedValue(
    options?.invokeWorkerResult ?? {
      data: { queued: true, releaseId: "44444444-4444-4444-8444-444444444444" },
      status: 202,
      success: true,
    },
  );
  const contentReleaseMaybeSingleMock = vi.fn().mockResolvedValue({
    data: options?.release ?? {
      audience_segment: "lessons",
      body_en: "A new lesson has been published.",
      body_nl: "Er is een nieuwe les gepubliceerd.",
      created_at: "2026-03-28T10:00:00.000Z",
      delivery_cursor: null,
      delivery_finished_at: null,
      delivery_requested_at: null,
      delivery_requested_by: null,
      delivery_started_at: null,
      delivery_summary: {},
      id: "44444444-4444-4444-8444-444444444444",
      last_delivery_error: null,
      locale_mode: "localized",
      release_type: "lesson",
      sent_at: null,
      status: "approved",
      subject_en: "New lesson available",
      subject_nl: "Nieuwe les beschikbaar",
      updated_at: "2026-03-28T10:00:00.000Z",
    },
    error: null,
  });
  const contentReleaseItemsSelectEqOrderMock = vi.fn().mockResolvedValue({
    data: options?.contentReleaseItems ?? [
      {
        created_at: "2026-03-28T10:00:00.000Z",
        id: "item_1",
        item_id: "lesson-1",
        item_type: "lesson",
        release_id: "44444444-4444-4444-8444-444444444444",
        title_snapshot: "Lesson 01",
        url_snapshot: "/grammar/lesson-1",
      },
    ],
    error: null,
  });
  const audienceContactsIsMock = vi.fn().mockResolvedValue({
    data: options?.audienceContacts ?? [
      {
        books_opt_in: false,
        consented_at: "2026-03-28T09:00:00.000Z",
        created_at: "2026-03-28T09:00:00.000Z",
        email: "reader@example.com",
        full_name: "Reader One",
        general_updates_opt_in: true,
        id: "audience_123",
        lessons_opt_in: true,
        locale: "en",
        profile_id: null,
        source: "dashboard",
        unsubscribed_at: null,
        updated_at: "2026-03-28T09:00:00.000Z",
      },
    ],
    error: null,
  });
  const audienceContactsOrderMock = vi.fn().mockResolvedValue({
    data: options?.audienceContacts ?? [
      {
        books_opt_in: false,
        consented_at: "2026-03-28T09:00:00.000Z",
        created_at: "2026-03-28T09:00:00.000Z",
        email: "reader@example.com",
        full_name: "Reader One",
        general_updates_opt_in: true,
        id: "audience_123",
        lessons_opt_in: true,
        locale: "en",
        profile_id: null,
        source: "dashboard",
        unsubscribed_at: null,
        updated_at: "2026-03-28T09:00:00.000Z",
      },
    ],
    error: null,
  });
  const syncStoredAudienceContactToResendMock = vi.fn().mockImplementation(
    async (contact: Record<string, unknown>) =>
      options?.resendAudienceSyncResult ?? {
        contact,
        success: true,
        syncState: null,
      },
  );
  const notificationEventsEqStatusMock = vi.fn().mockResolvedValue({
    data:
      options?.existingReleaseEvents?.map((event) => ({
        payload: event.payload ?? {},
        recipient: event.recipient,
        status: event.status ?? "sent",
      })) ?? [],
    error: null,
  });
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "submissions") {
        return {
          select: submissionSelectMock,
          update: submissionUpdateMock,
        };
      }

      if (table === "profiles") {
        return {
          select: profileSelectMock,
        };
      }

      if (table === "entry_reports") {
        return {
          update: vi.fn(() => ({
            eq: reportUpdateEqMock,
          })),
        };
      }

      if (table === "contact_messages") {
        return {
          update: vi.fn(() => ({
            eq: contactUpdateEqMock,
          })),
        };
      }

      if (table === "content_releases") {
        return {
          insert: contentReleaseInsertMock,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: contentReleaseMaybeSingleMock,
            })),
          })),
          update: vi.fn(() => ({
            eq: contentReleaseUpdateEqMock,
          })),
        };
      }

      if (table === "content_release_items") {
        return {
          insert: contentReleaseItemInsertMock,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: contentReleaseItemsSelectEqOrderMock,
            })),
          })),
        };
      }

      if (table === "audience_contacts") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: audienceContactsIsMock,
            })),
            order: audienceContactsOrderMock,
          })),
        };
      }

      if (table === "notification_events") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: notificationEventsEqStatusMock,
                })),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table requested in test: ${table}`);
    }),
  };
  const getAdminServerContextMock = vi.fn().mockResolvedValue(
    options?.isAdmin === false || options?.user === null
      ? null
      : {
          supabase,
          user: options?.user ?? { id: "admin_123" },
        },
  );

  vi.doMock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
  }));
  vi.doMock("@/lib/notifications/config", () => ({
    getNotificationEmailEnv: getNotificationEmailEnvMock,
  }));
  vi.doMock("@/lib/supabase/auth", () => ({
    getAdminServerContext: getAdminServerContextMock,
  }));
  vi.doMock("@/lib/supabase/config", () => ({
    hasSupabaseRuntimeEnv: vi.fn(() => options?.hasEnv ?? true),
  }));
  vi.doMock("@/lib/supabase/functions", () => ({
    invokeSupabaseEdgeFunction: invokeSupabaseEdgeFunctionMock,
  }));
  vi.doMock("@/lib/communications/resend", () => ({
    hasResendAudienceEnv: vi.fn(() => options?.hasResendAudienceEnv ?? true),
    syncStoredAudienceContactToResend: syncStoredAudienceContactToResendMock,
  }));
  vi.doMock("@/lib/notifications/events", () => ({
    dispatchLoggedNotificationEmail: dispatchLoggedNotificationEmailMock,
  }));

  const mod = await import("./admin");

  return {
    ...mod,
    contactUpdateEqMock,
    contentReleaseItemInsertMock,
    contentReleaseUpdateEqMock,
    dispatchLoggedNotificationEmailMock,
    getAdminServerContextMock,
    invokeSupabaseEdgeFunctionMock,
    profileMaybeSingleMock,
    revalidatePathMock,
    reportUpdateEqMock,
    submissionSelectMock,
    submissionUpdateEqMock,
    submissionUpdateMock,
    syncStoredAudienceContactToResendMock,
  } satisfies AdminModuleContext;
}

describe("admin feedback action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips admin feedback when Supabase is unavailable", async () => {
    const { getAdminServerContextMock, submitFeedback } = await loadAdminModule(
      {
        hasEnv: false,
      },
    );

    await expect(
      submitFeedback(createAdminFormData()),
    ).resolves.toBeUndefined();
    expect(getAdminServerContextMock).not.toHaveBeenCalled();
  });

  it("does nothing for non-admin users", async () => {
    const { submitFeedback, submissionUpdateMock } = await loadAdminModule({
      isAdmin: false,
    });

    await expect(
      submitFeedback(createAdminFormData()),
    ).resolves.toBeUndefined();
    expect(submissionUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid admin feedback payloads before updating submissions", async () => {
    const { submitFeedback, submissionUpdateMock } = await loadAdminModule();

    await expect(
      submitFeedback(
        createAdminFormData({
          feedback: "",
          rating: "9",
          submission_id: "bad-id",
        }),
      ),
    ).resolves.toBeUndefined();

    expect(submissionUpdateMock).not.toHaveBeenCalled();
  });

  it("updates submissions, stores review metadata, and emails the student", async () => {
    const {
      dispatchLoggedNotificationEmailMock,
      revalidatePathMock,
      submissionUpdateEqMock,
      submissionUpdateMock,
      submitFeedback,
    } = await loadAdminModule();

    await expect(
      submitFeedback(createAdminFormData()),
    ).resolves.toBeUndefined();

    expect(submissionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback_text: "Well done.",
        rating: 5,
        reviewed_at: expect.any(String),
        reviewed_by: "admin_123",
        status: "reviewed",
      }),
    );
    expect(submissionUpdateEqMock).toHaveBeenCalledWith(
      "id",
      "11111111-1111-4111-8111-111111111111",
    );
    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: "11111111-1111-4111-8111-111111111111",
        aggregateType: "submission",
        eventType: "submission_reviewed",
        subject: "Your Coptic Compass feedback is ready for lesson 1",
        text: expect.stringContaining("Well done."),
        to: "student@example.com",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/nl/dashboard");
  });

  it("still completes when the student review email cannot be sent", async () => {
    const { dispatchLoggedNotificationEmailMock, submitFeedback } =
      await loadAdminModule({
        feedbackNotificationResult: {
          success: false,
          error: "Provider unavailable",
        },
      });

    await expect(
      submitFeedback(createAdminFormData()),
    ).resolves.toBeUndefined();

    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledOnce();
  });

  it("rejects invalid entry report review payloads before updating reports", async () => {
    const { reportUpdateEqMock, updateEntryReportStatus } =
      await loadAdminModule();

    await expect(
      updateEntryReportStatus(
        createEntryReportAdminFormData({
          report_id: "bad-id",
          status: "not-a-status",
        }),
      ),
    ).resolves.toBeUndefined();

    expect(reportUpdateEqMock).not.toHaveBeenCalled();
  });

  it("updates dictionary entry reports and revalidates the admin page", async () => {
    const { revalidatePathMock, reportUpdateEqMock, updateEntryReportStatus } =
      await loadAdminModule();

    await expect(
      updateEntryReportStatus(createEntryReportAdminFormData()),
    ).resolves.toBeUndefined();

    expect(reportUpdateEqMock).toHaveBeenCalledWith(
      "id",
      "22222222-2222-4222-8222-222222222222",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
  });

  it("rejects invalid contact message review payloads before updating messages", async () => {
    const { contactUpdateEqMock, updateContactMessageStatus } =
      await loadAdminModule();

    await expect(
      updateContactMessageStatus(
        createContactMessageAdminFormData({
          contact_message_id: "bad-id",
          status: "not-a-status",
        }),
      ),
    ).resolves.toBeUndefined();

    expect(contactUpdateEqMock).not.toHaveBeenCalled();
  });

  it("updates contact messages and revalidates the admin page", async () => {
    const {
      contactUpdateEqMock,
      revalidatePathMock,
      updateContactMessageStatus,
    } = await loadAdminModule();

    await expect(
      updateContactMessageStatus(createContactMessageAdminFormData()),
    ).resolves.toBeUndefined();

    expect(contactUpdateEqMock).toHaveBeenCalledWith(
      "id",
      "33333333-3333-4333-8333-333333333333",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
  });

  it("creates a content release draft with snapshotted items", async () => {
    const {
      contentReleaseItemInsertMock,
      createContentReleaseDraft,
      revalidatePathMock,
    } = await loadAdminModule();

    await expect(
      createContentReleaseDraft(null, createContentReleaseDraftFormData()),
    ).resolves.toEqual({
      success: true,
    });

    expect(contentReleaseItemInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        item_id: "lesson-1",
        item_type: "lesson",
        release_id: "release_123",
        title_snapshot: "Lesson 01",
        url_snapshot: "/grammar/lesson-1",
      }),
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/nl/admin");
  });

  it("rejects content release drafts without selected items", async () => {
    const { contentReleaseItemInsertMock, createContentReleaseDraft } =
      await loadAdminModule();

    await expect(
      createContentReleaseDraft(
        null,
        createContentReleaseDraftFormData({
          releaseItems: [],
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "Select at least one lesson or publication for this release.",
    });

    expect(contentReleaseItemInsertMock).not.toHaveBeenCalled();
  });

  it("updates content release status and revalidates admin pages", async () => {
    const {
      contentReleaseUpdateEqMock,
      revalidatePathMock,
      updateContentReleaseStatus,
    } = await loadAdminModule();

    await expect(
      updateContentReleaseStatus(createContentReleaseStatusFormData()),
    ).resolves.toBeUndefined();

    expect(contentReleaseUpdateEqMock).toHaveBeenCalledWith(
      "id",
      "44444444-4444-4444-8444-444444444444",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/nl/admin");
  });

  it("queues approved content releases and starts the background worker", async () => {
    const {
      contentReleaseUpdateEqMock,
      invokeSupabaseEdgeFunctionMock,
      revalidatePathMock,
      sendContentRelease,
    } = await loadAdminModule();

    await expect(
      sendContentRelease(null, createContentReleaseStatusFormData()),
    ).resolves.toEqual({
      message: "Release queued. Delivery will continue in the background.",
      success: true,
    });

    expect(contentReleaseUpdateEqMock).toHaveBeenNthCalledWith(
      1,
      "id",
      "44444444-4444-4444-8444-444444444444",
    );
    expect(invokeSupabaseEdgeFunctionMock).toHaveBeenCalledWith(
      "process-content-release",
      {
        releaseId: "44444444-4444-4444-8444-444444444444",
      },
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
  });

  it("sends a localized preview email to the admin inbox without marking the release sent", async () => {
    const {
      contentReleaseUpdateEqMock,
      dispatchLoggedNotificationEmailMock,
      sendContentReleasePreview,
    } = await loadAdminModule();

    const formData = new FormData();
    formData.set("release_id", "44444444-4444-4444-8444-444444444444");
    formData.set("preview_locale", "nl");

    await expect(sendContentReleasePreview(null, formData)).resolves.toEqual({
      message: "Preview sent to owner@example.com.",
      success: true,
    });

    expect(dispatchLoggedNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: "44444444-4444-4444-8444-444444444444",
        aggregateType: "content_release",
        eventType: "content_release_test_sent",
        subject: "[Coptic Compass Preview] Nieuwe les beschikbaar",
        text: expect.stringContaining("In deze release:"),
        to: "owner@example.com",
      }),
    );
    expect(contentReleaseUpdateEqMock).not.toHaveBeenCalled();
  });

  it("rejects release queueing when background delivery is already in progress", async () => {
    const { invokeSupabaseEdgeFunctionMock, sendContentRelease } =
      await loadAdminModule({
        release: {
          audience_segment: "lessons",
          body_en: "A new lesson has been published.",
          body_nl: "Er is een nieuwe les gepubliceerd.",
          created_at: "2026-03-28T10:00:00.000Z",
          delivery_cursor: "reader-025@example.com",
          delivery_finished_at: null,
          delivery_requested_at: "2026-03-28T11:00:00.000Z",
          delivery_requested_by: "admin_123",
          delivery_started_at: "2026-03-28T11:00:02.000Z",
          delivery_summary: {},
          id: "44444444-4444-4444-8444-444444444444",
          last_delivery_error: null,
          locale_mode: "localized",
          release_type: "lesson",
          sent_at: null,
          status: "sending",
          subject_en: "New lesson available",
          subject_nl: "Nieuwe les beschikbaar",
          updated_at: "2026-03-28T11:00:02.000Z",
        },
      });

    await expect(
      sendContentRelease(null, createContentReleaseStatusFormData()),
    ).resolves.toEqual({
      message: "This release is already being delivered in the background.",
      success: false,
    });

    expect(invokeSupabaseEdgeFunctionMock).not.toHaveBeenCalled();
  });

  it("resumes queued releases without resetting their progress cursor", async () => {
    const {
      contentReleaseUpdateEqMock,
      invokeSupabaseEdgeFunctionMock,
      sendContentRelease,
    } = await loadAdminModule({
      release: {
        audience_segment: "lessons",
        body_en: "A new lesson has been published.",
        body_nl: "Er is een nieuwe les gepubliceerd.",
        created_at: "2026-03-28T10:00:00.000Z",
        delivery_cursor: "reader-025@example.com",
        delivery_finished_at: null,
        delivery_requested_at: "2026-03-28T11:00:00.000Z",
        delivery_requested_by: "admin_123",
        delivery_started_at: null,
        delivery_summary: {
          item_count: 1,
          processed_recipient_count: 25,
          remaining_recipient_count: 10,
        },
        id: "44444444-4444-4444-8444-444444444444",
        last_delivery_error:
          "The next delivery batch could not be started automatically.",
        locale_mode: "localized",
        release_type: "lesson",
        sent_at: null,
        status: "queued",
        subject_en: "New lesson available",
        subject_nl: "Nieuwe les beschikbaar",
        updated_at: "2026-03-28T11:05:00.000Z",
      },
    });

    await expect(
      sendContentRelease(null, createContentReleaseStatusFormData()),
    ).resolves.toEqual({
      message:
        "Queued release resumed. Delivery will continue in the background.",
      success: true,
    });

    expect(contentReleaseUpdateEqMock).not.toHaveBeenCalled();
    expect(invokeSupabaseEdgeFunctionMock).toHaveBeenCalledWith(
      "process-content-release",
      {
        releaseId: "44444444-4444-4444-8444-444444444444",
      },
    );
  });

  it("reverts queued releases when the background worker cannot be started", async () => {
    const { contentReleaseUpdateEqMock, sendContentRelease } =
      await loadAdminModule({
        invokeWorkerResult: {
          error: "Worker unavailable",
          status: 500,
          success: false,
        },
      });

    await expect(
      sendContentRelease(null, createContentReleaseStatusFormData()),
    ).resolves.toEqual({
      message: "The background release worker could not be started right now.",
      success: false,
    });

    expect(contentReleaseUpdateEqMock).toHaveBeenNthCalledWith(
      1,
      "id",
      "44444444-4444-4444-8444-444444444444",
    );
    expect(contentReleaseUpdateEqMock).toHaveBeenNthCalledWith(
      2,
      "id",
      "44444444-4444-4444-8444-444444444444",
    );
  });

  it("syncs audience contacts to Resend from the admin dashboard", async () => {
    const {
      revalidatePathMock,
      syncAudienceContactsWithResend,
      syncStoredAudienceContactToResendMock,
    } = await loadAdminModule();

    await expect(
      syncAudienceContactsWithResend(null, new FormData()),
    ).resolves.toEqual({
      message: "Synced 1 audience contact.",
      success: true,
    });

    expect(syncStoredAudienceContactToResendMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/nl/admin");
  });

  it("reports missing Resend audience configuration for admin sync", async () => {
    const {
      syncAudienceContactsWithResend,
      syncStoredAudienceContactToResendMock,
    } = await loadAdminModule({
      hasResendAudienceEnv: false,
    });

    await expect(
      syncAudienceContactsWithResend(null, new FormData()),
    ).resolves.toEqual({
      message: "Resend audience sync is not configured yet.",
      success: false,
    });

    expect(syncStoredAudienceContactToResendMock).not.toHaveBeenCalled();
  });
});
