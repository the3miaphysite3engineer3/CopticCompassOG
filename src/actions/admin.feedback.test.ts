import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminFormData,
  createContactMessageAdminFormData,
  createEntryReportAdminFormData,
  createSubmissionDeletionFormData,
  loadAdminModule,
} from "./admin.test-helpers";

describe("admin moderation actions", () => {
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
      queueLoggedNotificationEmailMock,
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
    expect(queueLoggedNotificationEmailMock).toHaveBeenCalledWith(
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
    const { queueLoggedNotificationEmailMock, submitFeedback } =
      await loadAdminModule({
        feedbackNotificationResult: {
          success: false,
          error: "Provider unavailable",
        },
      });

    await expect(
      submitFeedback(createAdminFormData()),
    ).resolves.toBeUndefined();

    expect(queueLoggedNotificationEmailMock).toHaveBeenCalledOnce();
  });

  it("soft deletes duplicate submissions and revalidates instructor and student views", async () => {
    const {
      deleteSubmission,
      dispatchLoggedNotificationEmailMock,
      revalidatePathMock,
      submissionUpdateEqMock,
      submissionUpdateMock,
    } = await loadAdminModule();

    await expect(
      deleteSubmission(createSubmissionDeletionFormData()),
    ).resolves.toBeUndefined();

    expect(submissionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
        deleted_by: "admin_123",
        deletion_reason: "duplicate_submission",
      }),
    );
    expect(submissionUpdateEqMock).toHaveBeenCalledWith(
      "id",
      "11111111-1111-4111-8111-111111111111",
    );
    expect(dispatchLoggedNotificationEmailMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/grammar/lesson-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/nl/dashboard");
  });

  it("rejects invalid submission deletion payloads before updating submissions", async () => {
    const { deleteSubmission, submissionUpdateMock } = await loadAdminModule();

    await expect(
      deleteSubmission(
        createSubmissionDeletionFormData({
          deletion_reason: "x",
          submission_id: "bad-id",
        }),
      ),
    ).resolves.toBeUndefined();

    expect(submissionUpdateMock).not.toHaveBeenCalled();
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
});
