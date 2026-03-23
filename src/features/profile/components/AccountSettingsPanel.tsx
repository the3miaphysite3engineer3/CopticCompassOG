'use client'

import type { ReactNode } from 'react'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, KeyRound, TriangleAlert, UserRound } from 'lucide-react'
import { updatePasswordFromDashboard } from '@/actions/auth'
import { Badge } from '@/components/Badge'
import { FormField } from '@/components/FormField'
import { StatusNotice } from '@/components/StatusNotice'
import { SurfacePanel } from '@/components/SurfacePanel'
import { cx } from '@/lib/classes'
import { ProfileForm } from '@/features/profile/components/ProfileForm'
import type { Tables } from '@/types/supabase'

type AccountSettingsPanelProps = {
  canUpdatePassword: boolean
  profile: Tables<'profiles'>
  providerLabel: string
}

type AccountSectionId = 'profile' | 'password' | 'delete'

function AccountSettingsSection({
  badge,
  children,
  description,
  icon,
  isOpen,
  onToggle,
  title,
}: {
  badge?: ReactNode
  children: ReactNode
  description: string
  icon: ReactNode
  isOpen: boolean
  onToggle: () => void
  title: string
}) {
  return (
    <section className="border-t border-stone-200/80 first:border-t-0 dark:border-stone-800/80">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-white/40 dark:hover:bg-stone-900/20"
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
            {badge}
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-300">
            {description}
          </p>
        </div>
        <ChevronDown
          className={cx(
            'mt-1 h-5 w-5 shrink-0 text-stone-400 transition-transform dark:text-stone-500',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen ? (
        <div className="border-t border-stone-200/80 px-6 py-6 dark:border-stone-800/80">
          {children}
        </div>
      ) : null}
    </section>
  )
}

function PasswordSettingsForm({ canUpdatePassword, providerLabel }: {
  canUpdatePassword: boolean
  providerLabel: string
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  function handleSubmit(formData: FormData) {
    setStatus(null)

    startTransition(async () => {
      const result = await updatePasswordFromDashboard(formData)
      if (result.success) {
        setStatus({ message: 'Password updated successfully.', type: 'success' })
        return
      }

      setStatus({ message: result.error || 'Could not update your password.', type: 'error' })
    })
  }

  if (!canUpdatePassword) {
    return (
      <StatusNotice tone="info" align="left">
        {`This account signs in with ${providerLabel}, so password changes are not managed here.`}
      </StatusNotice>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-5 text-stone-800 dark:text-stone-200">
      <FormField htmlFor="password" label="New Password">
        <input
          id="password"
          name="password"
          type="password"
          className="input-base"
          placeholder="Must be at least 8 characters"
          required
        />
      </FormField>

      <FormField htmlFor="confirm_password" label="Confirm New Password">
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          className="input-base"
          placeholder="Repeat your new password"
          required
        />
      </FormField>

      <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
        Use a password you do not reuse elsewhere. Updating it here keeps your dashboard login current without leaving this page.
      </p>

      <button type="submit" className="btn-primary px-6" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update Password'}
      </button>

      {status ? (
        <StatusNotice tone={status.type} align="left">
          {status.message}
        </StatusNotice>
      ) : null}
    </form>
  )
}

function DeleteProfileNotice() {
  return (
    <div className="space-y-5">
      <StatusNotice tone="error" align="left" title="Permanent deletion">
        Account deletion is currently handled manually so we can safely remove your profile and the learning data tied to it.
      </StatusNotice>

      <div className="space-y-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
        <p>
          Requesting deletion removes your profile together with associated dashboard data such as submissions, lesson progress, bookmarks, and notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/contact" className="btn-primary px-6">
          Request Deletion
        </Link>
        <Link href="/privacy" className="btn-secondary px-6">
          Review Privacy Policy
        </Link>
      </div>
    </div>
  )
}

export function AccountSettingsPanel({
  canUpdatePassword,
  profile,
  providerLabel,
}: AccountSettingsPanelProps) {
  const [openSection, setOpenSection] = useState<AccountSectionId | null>('profile')
  const providerBadgeLabel = canUpdatePassword ? 'Available' : 'External sign-in'

  return (
    <SurfacePanel rounded="3xl" className="overflow-hidden p-0">
      <div className="border-b border-stone-200/80 px-6 py-5 dark:border-stone-800/80">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Account
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Settings
          </h2>
          <Badge tone="surface" size="xs">
            Private
          </Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300">
          Manage your profile details, password access, and account-level requests without cluttering the rest of the dashboard.
        </p>
      </div>

      <AccountSettingsSection
        icon={<UserRound className="h-5 w-5" />}
        title="Profile Settings"
        description="Update your display name and avatar while keeping your sign-in email visible for reference."
        isOpen={openSection === 'profile'}
        onToggle={() => setOpenSection((current) => current === 'profile' ? null : 'profile')}
      >
        <ProfileForm profile={profile} embedded />
      </AccountSettingsSection>

      <AccountSettingsSection
        icon={<KeyRound className="h-5 w-5" />}
        title="Update Password"
        description={
          canUpdatePassword
            ? 'Change your dashboard password here instead of leaving the dashboard flow.'
            : `This account uses ${providerLabel} for sign-in, so password changes are not managed locally.`
        }
        badge={
          <Badge tone={canUpdatePassword ? 'accent' : 'neutral'} size="xs">
            {providerBadgeLabel}
          </Badge>
        }
        isOpen={openSection === 'password'}
        onToggle={() => setOpenSection((current) => current === 'password' ? null : 'password')}
      >
        <PasswordSettingsForm
          canUpdatePassword={canUpdatePassword}
          providerLabel={providerLabel}
        />
      </AccountSettingsSection>

      <AccountSettingsSection
        icon={<TriangleAlert className="h-5 w-5" />}
        title="Delete Profile"
        description="Review the permanent deletion path before removing your account and associated learning data."
        badge={
          <Badge tone="neutral" size="xs">
            Manual review
          </Badge>
        }
        isOpen={openSection === 'delete'}
        onToggle={() => setOpenSection((current) => current === 'delete' ? null : 'delete')}
      >
        <DeleteProfileNotice />
      </AccountSettingsSection>
    </SurfacePanel>
  )
}
