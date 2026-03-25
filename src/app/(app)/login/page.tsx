import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { getTranslation } from "@/lib/i18n";
import { createNoIndexMetadata } from '@/lib/metadata'
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();

  return createNoIndexMetadata({
    title: getTranslation(language, "login.metaTitle"),
    description: getTranslation(language, "login.metaDescription"),
  });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    messageType?: 'error' | 'success' | 'info'
    redirect_to?: string
    state?: string
  }>
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
