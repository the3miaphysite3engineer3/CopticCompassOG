import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectError extends Error {
  constructor(readonly destination: string) {
    super(`Redirected to ${destination}`);
  }
}

type AuthModuleContext = {
  login: typeof import("./auth").login;
  signup: typeof import("./auth").signup;
  logout: typeof import("./auth").logout;
  updatePasswordFromDashboard: typeof import("./auth").updatePasswordFromDashboard;
  consumeRateLimitMock: ReturnType<typeof vi.fn>;
  createClientMock: ReturnType<typeof vi.fn>;
  getClientRateLimitIdentifierMock: ReturnType<typeof vi.fn>;
  getAuthUnavailableLoginPathMock: ReturnType<typeof vi.fn>;
  getLoginPathMock: ReturnType<typeof vi.fn>;
  hasSupabaseRuntimeEnvMock: ReturnType<typeof vi.fn>;
  revalidatePathMock: ReturnType<typeof vi.fn>;
  redirectMock: ReturnType<typeof vi.fn>;
  signInWithPasswordMock: ReturnType<typeof vi.fn>;
  signOutMock: ReturnType<typeof vi.fn>;
  signUpMock: ReturnType<typeof vi.fn>;
  updateUserMock: ReturnType<typeof vi.fn>;
};

function createRedirectMock() {
  return vi.fn((destination: string) => {
    throw new RedirectError(destination);
  });
}

function createLoginFormData(overrides?: Partial<Record<"email" | "password" | "redirectTo", string>>) {
  const formData = new FormData();
  formData.set("email", overrides?.email ?? "user@example.com");
  formData.set("password", overrides?.password ?? "password123");

  if (overrides?.redirectTo !== undefined) {
    formData.set("redirectTo", overrides.redirectTo);
  }

  return formData;
}

async function loadAuthModule(options?: {
  hasEnv?: boolean;
  rateLimitOk?: boolean;
  updateUserError?: unknown;
  user?: { id: string } | null;
  signInError?: unknown;
  signOutError?: unknown;
  signUpError?: unknown;
  signUpSession?: unknown;
}) {
  vi.resetModules();

  const revalidatePathMock = vi.fn();
  const redirectMock = createRedirectMock();
  const consumeRateLimitMock = vi.fn().mockResolvedValue({
    ok: options?.rateLimitOk ?? true,
    remaining: 1,
    resetAt: Date.now() + 60_000,
    retryAfterMs: 60_000,
  });
  const getClientRateLimitIdentifierMock = vi.fn().mockResolvedValue("client-fingerprint");
  const getAuthUnavailableLoginPathMock = vi
    .fn((redirectTo?: string) =>
      redirectTo
        ? `/login?state=auth-unavailable&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`
        : "/login?state=auth-unavailable&messageType=error"
    );
  const getLoginPathMock = vi
    .fn((redirectTo?: string) =>
      redirectTo
        ? `/login?redirect_to=${encodeURIComponent(redirectTo)}`
        : "/login"
    );
  const hasSupabaseRuntimeEnvMock = vi.fn(() => options?.hasEnv ?? true);
  const signInWithPasswordMock = vi
    .fn()
    .mockResolvedValue({ error: options?.signInError ?? null });
  const signUpMock = vi.fn().mockResolvedValue({
    data: { session: options?.signUpSession ?? null },
    error: options?.signUpError ?? null,
  });
  const signOutMock = vi.fn().mockResolvedValue({ error: options?.signOutError ?? null });
  const updateUserMock = vi
    .fn()
    .mockResolvedValue({ error: options?.updateUserError ?? null });
  const createClientMock = vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options?.user === undefined ? { id: "user-1" } : options.user },
      }),
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      signUp: signUpMock,
      updateUser: updateUserMock,
    },
  });

  vi.doMock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
  }));
  vi.doMock("next/navigation", () => ({
    redirect: redirectMock,
  }));
  vi.doMock("@/lib/rateLimit", () => ({
    consumeRateLimit: consumeRateLimitMock,
    getClientRateLimitIdentifier: getClientRateLimitIdentifierMock,
  }));
  vi.doMock("@/lib/site", () => ({
    getSiteUrl: () => new URL("https://example.com"),
  }));
  vi.doMock("@/lib/supabase/config", () => ({
    getAuthUnavailableLoginPath: getAuthUnavailableLoginPathMock,
    getLoginPath: getLoginPathMock,
    hasSupabaseRuntimeEnv: hasSupabaseRuntimeEnvMock,
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
  }));

  const mod = await import("./auth");

  return {
    ...mod,
    consumeRateLimitMock,
    createClientMock,
    getClientRateLimitIdentifierMock,
    getAuthUnavailableLoginPathMock,
    getLoginPathMock,
    hasSupabaseRuntimeEnvMock,
    revalidatePathMock,
    redirectMock,
    signInWithPasswordMock,
    signOutMock,
    signUpMock,
    updateUserMock,
  } satisfies AuthModuleContext;
}

function createPasswordUpdateFormData(
  overrides?: Partial<Record<"password" | "confirm_password", string>>,
) {
  const formData = new FormData();
  formData.set("password", overrides?.password ?? "password123");
  formData.set(
    "confirm_password",
    overrides?.confirm_password ?? overrides?.password ?? "password123",
  );

  return formData;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects login attempts when auth is unavailable", async () => {
    const { createClientMock, getAuthUnavailableLoginPathMock, login } = await loadAuthModule({
      hasEnv: false,
    });

    await expect(login(createLoginFormData({ redirectTo: "/dashboard" }))).rejects.toMatchObject({
      destination: "/login?state=auth-unavailable&messageType=error&redirect_to=%2Fdashboard",
    });

    expect(getAuthUnavailableLoginPathMock).toHaveBeenCalledWith("/dashboard");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rejects invalid login input before contacting Supabase", async () => {
    const { createClientMock, login } = await loadAuthModule();

    await expect(
      login(createLoginFormData({ email: "bad-email", password: "" }))
    ).rejects.toMatchObject({
      destination:
        "/login?state=login-invalid-input&messageType=error&redirect_to=%2Fdashboard",
    });

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rate limits login attempts before contacting Supabase", async () => {
    const { createClientMock, login } = await loadAuthModule({
      rateLimitOk: false,
    });

    await expect(login(createLoginFormData({ redirectTo: "/dictionary" }))).rejects.toMatchObject({
      destination:
        "/login?state=login-rate-limited&messageType=error&redirect_to=%2Fdictionary",
    });

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("normalizes login credentials and redirects to a safe local path", async () => {
    const { login, revalidatePathMock, signInWithPasswordMock } = await loadAuthModule();

    await expect(
      login(
        createLoginFormData({
          email: " USER@Example.com ",
          password: "password123",
          redirectTo: "https://evil.example",
        })
      )
    ).rejects.toMatchObject({
      destination: "/dashboard",
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects scheme-relative redirect targets during login", async () => {
    const { login } = await loadAuthModule();

    await expect(
      login(
        createLoginFormData({
          redirectTo: "//evil.example",
        }),
      ),
    ).rejects.toMatchObject({
      destination: "/dashboard",
    });
  });

  it("rejects invalid signup input before contacting Supabase", async () => {
    const { createClientMock, signup } = await loadAuthModule();

    await expect(
      signup(createLoginFormData({ email: "invalid", password: "short" }))
    ).rejects.toMatchObject({
      destination:
        "/login?state=signup-invalid-input&messageType=error&redirect_to=%2Fdashboard",
    });

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("redirects to the email confirmation state when signup has no session", async () => {
    const { revalidatePathMock, signup, signUpMock } = await loadAuthModule({
      signUpSession: null,
    });

    await expect(signup(createLoginFormData())).rejects.toMatchObject({
      destination:
        "/login?state=signup-check-email&messageType=success&redirect_to=%2Fdashboard",
    });

    expect(signUpMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
      options: {
        emailRedirectTo:
          "https://example.com/login?state=signup-confirmed&messageType=success&redirect_to=%2Fdashboard",
      },
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("signs out and redirects back to login", async () => {
    const { logout, revalidatePathMock, signOutMock } = await loadAuthModule();

    await expect(logout()).rejects.toMatchObject({
      destination: "/login?redirect_to=%2Fdashboard",
    });

    expect(signOutMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("returns an inline error when dashboard password confirmation does not match", async () => {
    const { createClientMock, updatePasswordFromDashboard } = await loadAuthModule();

    await expect(
      updatePasswordFromDashboard(
        createPasswordUpdateFormData({
          password: "password123",
          confirm_password: "password124",
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "Passwords do not match.",
    });

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("updates the password from the dashboard without redirecting", async () => {
    const {
      revalidatePathMock,
      updatePasswordFromDashboard,
      updateUserMock,
    } = await loadAuthModule();

    await expect(
      updatePasswordFromDashboard(createPasswordUpdateFormData()),
    ).resolves.toEqual({
      success: true,
    });

    expect(updateUserMock).toHaveBeenCalledWith({
      password: "password123",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a helpful dashboard password error when no authenticated user is present", async () => {
    const { updatePasswordFromDashboard } = await loadAuthModule({
      user: null,
    });

    await expect(
      updatePasswordFromDashboard(createPasswordUpdateFormData()),
    ).resolves.toEqual({
      success: false,
      error: "You must be logged in to update your password.",
    });
  });
});
