"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  consumeRateLimit,
  getClientRateLimitIdentifier,
} from "@/lib/rateLimit";
import {
  getAuthUnavailableLoginPath,
  getLoginPath,
  hasSupabaseRuntimeEnv,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import {
  getFormString,
  hasLengthInRange,
  isValidEmail,
  normalizeWhitespace,
} from "@/lib/validation";
import { revalidateDashboardPaths } from "@/lib/server/revalidation";

function getSafeRedirectTarget(value: FormDataEntryValue | null) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/dashboard";
  }

  return value;
}

function getNormalizedEmail(formData: FormData) {
  return normalizeWhitespace(getFormString(formData, "email")).toLowerCase();
}

function getPassword(formData: FormData) {
  return getFormString(formData, "password");
}

function getTrustedAuthBaseUrl() {
  const baseUrl = getSiteUrl()?.toString() ?? "https://kyrilloswannes.com";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

type PasswordUpdateResult =
  | { success: true }
  | {
      success: false;
      code:
        | "auth-unavailable"
        | "invalid-input"
        | "rate-limited"
        | "not-authenticated"
        | "update-error";
      message: string;
    };

async function updatePasswordWithResult(
  password: string,
): Promise<PasswordUpdateResult> {
  if (!hasSupabaseRuntimeEnv()) {
    return {
      success: false,
      code: "auth-unavailable",
      message: "Authentication is currently unavailable.",
    };
  }

  if (!hasLengthInRange(password, { min: 8, max: 128 })) {
    return {
      success: false,
      code: "invalid-input",
      message: "Password must be at least 8 characters long.",
    };
  }

  const clientIdentifier = await getClientRateLimitIdentifier();
  const updateRateLimit = await consumeRateLimit({
    identifier: clientIdentifier,
    limit: 5,
    namespace: "auth:update",
    windowMs: 60 * 60 * 1000,
  });

  if (!updateRateLimit.ok) {
    return {
      success: false,
      code: "rate-limited",
      message: "Too many attempts. Please wait a bit before trying again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      code: "not-authenticated",
      message: "You must be logged in to update your password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      code: "update-error",
      message:
        "Could not update your password. The current session may have expired.",
    };
  }

  revalidatePath("/", "layout");
  revalidateDashboardPaths();
  return { success: true };
}

export async function login(formData: FormData) {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));
  const email = getNormalizedEmail(formData);
  const password = getPassword(formData);

  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath(redirectTo));
  }

  if (
    !isValidEmail(email) ||
    !hasLengthInRange(password, { min: 1, max: 128 })
  ) {
    redirect(
      `/login?state=login-invalid-input&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  const clientIdentifier = await getClientRateLimitIdentifier();
  const loginRateLimit = await consumeRateLimit({
    identifier: clientIdentifier,
    limit: 5,
    namespace: "auth:login",
    windowMs: 10 * 60 * 1000,
  });

  if (!loginRateLimit.ok) {
    redirect(
      `/login?state=login-rate-limited&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createClient();
  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(
      `/login?state=login-error&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));

  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath(redirectTo));
  }

  const loginUrl = new URL("/login", getTrustedAuthBaseUrl());
  loginUrl.searchParams.set("state", "signup-confirmed");
  loginUrl.searchParams.set("messageType", "success");
  loginUrl.searchParams.set("redirect_to", redirectTo);
  const email = getNormalizedEmail(formData);
  const password = getPassword(formData);

  if (
    !isValidEmail(email) ||
    !hasLengthInRange(password, { min: 8, max: 128 })
  ) {
    redirect(
      `/login?state=signup-invalid-input&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  const clientIdentifier = await getClientRateLimitIdentifier();
  const signupRateLimit = await consumeRateLimit({
    identifier: clientIdentifier,
    limit: 3,
    namespace: "auth:signup",
    windowMs: 60 * 60 * 1000,
  });

  if (!signupRateLimit.ok) {
    redirect(
      `/login?state=signup-rate-limited&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: loginUrl.toString(),
    },
  });

  if (error) {
    redirect(
      `/login?state=signup-error&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  if (!data.session) {
    redirect(
      `/login?state=signup-check-email&messageType=success&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function logout(formData?: FormData) {
  const redirectTo =
    formData instanceof FormData
      ? getSafeRedirectTarget(formData.get("redirectTo"))
      : "/dashboard";

  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath(redirectTo));
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(getLoginPath(redirectTo));
}

export async function resetPassword(formData: FormData) {
  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath());
  }

  const email = getNormalizedEmail(formData);
  if (!isValidEmail(email)) {
    redirect("/forgot-password?state=forgot-invalid-input&messageType=error");
  }

  const clientIdentifier = await getClientRateLimitIdentifier();
  const resetRateLimit = await consumeRateLimit({
    identifier: clientIdentifier,
    limit: 3,
    namespace: "auth:reset",
    windowMs: 60 * 60 * 1000,
  });

  if (!resetRateLimit.ok) {
    redirect("/forgot-password?state=forgot-rate-limited&messageType=error");
  }

  const supabase = await createClient();
  const baseUrl = getTrustedAuthBaseUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/update-password`,
  });

  if (error) {
    redirect("/forgot-password?state=forgot-error&messageType=error");
  }

  redirect("/forgot-password?state=forgot-success&messageType=success");
}

export async function updatePassword(formData: FormData) {
  const password = getPassword(formData);
  const result = await updatePasswordWithResult(password);

  if (!result.success) {
    if (result.code === "auth-unavailable") {
      redirect(getAuthUnavailableLoginPath());
    }

    if (result.code === "invalid-input") {
      redirect("/update-password?state=update-invalid-input&messageType=error");
    }

    if (result.code === "rate-limited") {
      redirect("/update-password?state=update-rate-limited&messageType=error");
    }

    if (result.code === "not-authenticated") {
      redirect("/login?state=login-error&messageType=error");
    }

    redirect("/update-password?state=update-error&messageType=error");
  }

  redirect("/dashboard");
}

export async function updatePasswordFromDashboard(formData: FormData) {
  const password = getPassword(formData);
  const confirmPassword = getFormString(formData, "confirm_password");

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Passwords do not match.",
    };
  }

  const result = await updatePasswordWithResult(password);

  if (!result.success) {
    return {
      success: false,
      error: result.message,
    };
  }

  return { success: true };
}

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));

  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath(redirectTo));
  }

  const supabase = await createClient();
  const baseUrl = getTrustedAuthBaseUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect(
      `/login?state=login-error&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
    );
  }

  if (data?.url) {
    redirect(data.url);
  }

  redirect(
    `/login?state=login-error&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`,
  );
}
