import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { createNoIndexMetadata } from '@/lib/metadata'

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Sign In',
  description: 'Account sign-in for the Wannes learning workspace.',
})

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
