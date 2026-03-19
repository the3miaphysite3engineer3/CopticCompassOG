'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site'

function getSafeRedirectTarget(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return '/dashboard'
  }

  return value
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const redirectTo = getSafeRedirectTarget(formData.get('redirectTo'))

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?state=login-error&messageType=error&redirect_to=${encodeURIComponent(redirectTo)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const loginUrl = new URL('/login', getSiteUrl()?.toString() ?? 'https://kyrilloswannes.com')
  loginUrl.searchParams.set('state', 'signup-confirmed')
  loginUrl.searchParams.set('messageType', 'success')

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
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
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
