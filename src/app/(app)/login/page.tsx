import { LoginForm } from "@/features/auth/components/LoginForm";
import { getTranslation } from "@/lib/i18n";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();

  return createNoIndexMetadata({
    title: getTranslation(language, "login.metaTitle"),
    description: getTranslation(language, "login.metaDescription"),
  });
}

/**
 * Renders the non-localized sign-in and signup page, including any flashed auth
 * notices passed through the query string.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    messageType?: "error" | "success" | "info";
    redirect_to?: string;
    state?: string;
  }>;
}) {
  const { message, messageType, redirect_to, state } = await searchParams;

  return (
    <LoginForm
      message={message}
      messageType={messageType}
      redirectTo={redirect_to}
      state={state}
    />
  );
}
