'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  consumeRateLimit,
  getClientRateLimitIdentifier,
} from '@/lib/rateLimit'
import {
  getAuthUnavailableLoginPath,
  hasSupabaseRuntimeEnv,
} from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site'
import {
  getFormString,
  hasLengthInRange,
  isValidEmail,
  normalizeWhitespace,
} from '@/lib/validation'

function getSafeRedirectTarget(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return '/dashboard'
  }

  return value
}

function getNormalizedEmail(formData: FormData) {
  return normalizeWhitespace(getFormString(formData, 'email')).toLowerCase()
}

function getPassword(formData: FormData) {
  return getFormString(formData, 'password')
}

export async function login(formData: FormData) {
  const redirectTo = getSafeRedirectTarget(formData.get('redirectTo'))
  const email = getNormalizedEmail(formData)
  const password = getPassword(formData)

  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath(redirectTo))
  }

  if (!isValidEmail(email) || !hasLengthInRange(password, { min: 1, max: 128 })) {
    redirect(`/login?state=login-invalid-input&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`)
  }

  const clientIdentifier = await getClientRateLimitIdentifier()
  const loginRateLimit = consumeRateLimit({
    identifier: clientIdentifier,
    limit: 5,
    namespace: 'auth:login',
    windowMs: 10 * 60 * 1000,
  })

  if (!loginRateLimit.ok) {
    redirect(`/login?state=login-rate-limited&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`)
  }

  const supabase = await createClient()
  const data = {
    email,
    password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?state=login-error&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath())
  }

  const loginUrl = new URL('/login', getSiteUrl()?.toString() ?? 'https://kyrilloswannes.com')
  loginUrl.searchParams.set('state', 'signup-confirmed')
  loginUrl.searchParams.set('messageType', 'success')
  const email = getNormalizedEmail(formData)
  const password = getPassword(formData)

  if (!isValidEmail(email) || !hasLengthInRange(password, { min: 8, max: 128 })) {
    redirect('/login?state=signup-invalid-input&messageType=error')
  }

  const clientIdentifier = await getClientRateLimitIdentifier()
  const signupRateLimit = consumeRateLimit({
    identifier: clientIdentifier,
    limit: 3,
    namespace: 'auth:signup',
    windowMs: 60 * 60 * 1000,
  })

  if (!signupRateLimit.ok) {
    redirect('/login?state=signup-rate-limited&messageType=error')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: loginUrl.toString(),
    },
  })

  if (error) {
    redirect('/login?state=signup-error&messageType=error')
  }

  if (!data.session) {
    redirect('/login?state=signup-check-email&messageType=success')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  if (!hasSupabaseRuntimeEnv()) {
    redirect(getAuthUnavailableLoginPath())
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
