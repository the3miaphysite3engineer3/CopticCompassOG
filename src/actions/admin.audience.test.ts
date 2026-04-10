import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadAdminModule } from "./admin.test-helpers";

describe("admin audience sync action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
