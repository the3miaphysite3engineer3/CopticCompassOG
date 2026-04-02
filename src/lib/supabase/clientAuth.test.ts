import { describe, expect, it, vi } from "vitest";
import { isInvalidRefreshTokenError, loadBrowserUser } from "./clientAuth";

describe("isInvalidRefreshTokenError", () => {
  it("matches common stale refresh-token failures", () => {
    expect(
      isInvalidRefreshTokenError(
        new Error("Invalid Refresh Token: Refresh Token Not Found"),
      ),
    ).toBe(true);
    expect(
      isInvalidRefreshTokenError({ message: "invalid refresh token" }),
    ).toBe(true);
    expect(isInvalidRefreshTokenError(new Error("Something else"))).toBe(false);
  });
});

describe("loadBrowserUser", () => {
  it("returns the authenticated user when Supabase succeeds", async () => {
    const user = { id: "user-1" };
    const getUser = vi.fn().mockResolvedValue({ data: { user }, error: null });
    const signOut = vi.fn();
    const supabase = {
      auth: {
        getUser,
        signOut,
      },
    } as never;

    await expect(loadBrowserUser(supabase)).resolves.toEqual(user);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("clears the local browser session for invalid refresh-token errors", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid Refresh Token: Refresh Token Not Found" },
    });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      auth: {
        getUser,
        signOut,
      },
    } as never;

    await expect(loadBrowserUser(supabase)).resolves.toBeNull();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rethrows unrelated unexpected failures", async () => {
    const getUser = vi.fn().mockRejectedValue(new Error("network down"));
    const signOut = vi.fn();
    const supabase = {
      auth: {
        getUser,
        signOut,
      },
    } as never;

    await expect(loadBrowserUser(supabase)).rejects.toThrow("network down");
    expect(signOut).not.toHaveBeenCalled();
  });
});
