'use client'

import { useState, useTransition } from 'react'
import { updateCommunicationPreferences } from '@/actions/communications'
import { FormField } from '@/components/FormField'
import { StatusNotice } from '@/components/StatusNotice'
import { useLanguage } from '@/components/LanguageProvider'
import { getDashboardCopy } from '@/features/dashboard/lib/dashboardCopy'
import type { AudiencePreferences } from '@/features/communications/lib/communications'

type CommunicationPreferencesFormProps = {
  deliveryEmail: string | null
  preferences: AudiencePreferences
}

export function CommunicationPreferencesForm({
  deliveryEmail,
  preferences,
}: CommunicationPreferencesFormProps) {
  const { language } = useLanguage()
  const copy = getDashboardCopy(language)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(null)

  function handleSubmit(formData: FormData) {
    setStatus(null)

    startTransition(async () => {
      const result = await updateCommunicationPreferences(formData)
      setStatus({
        message:
          result.message ??
          (result.success
            ? copy.account.communicationSaveIdle
            : copy.account.communicationDescription),
        type: result.success ? 'success' : 'error',
      })
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 text-stone-800 dark:text-stone-200">
      <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
        {copy.account.communicationLead}
      </p>

      <FormField htmlFor="communication_email" label={copy.account.communicationEmailLabel}>
        <input
          id="communication_email"
          type="email"
          className="input-base bg-stone-50 text-stone-500 dark:bg-stone-900"
          defaultValue={deliveryEmail ?? ''}
          disabled
        />
      </FormField>

      <FormField htmlFor="locale" label={copy.account.communicationLocaleLabel}>
        <select
          id="locale"
          name="locale"
          defaultValue={preferences.locale}
          className="select-base"
        >
          <option value="en">English</option>
          <option value="nl">Nederlands</option>
        </select>
        <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
          {copy.account.communicationLocaleHint}
        </p>
      </FormField>

      <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/30">
        <label className="flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <input
            type="checkbox"
            name="lessons_opt_in"
            value="true"
            defaultChecked={preferences.lessonsOptIn}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-950"
          />
          <span>{copy.account.communicationLessonsLabel}</span>
        </label>

        <label className="flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <input
            type="checkbox"
            name="books_opt_in"
            value="true"
            defaultChecked={preferences.booksOptIn}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-950"
          />
          <span>{copy.account.communicationBooksLabel}</span>
        </label>

        <label className="flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          <input
            type="checkbox"
            name="general_updates_opt_in"
            value="true"
            defaultChecked={preferences.generalUpdatesOptIn}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-950"
          />
          <span>{copy.account.communicationGeneralLabel}</span>
        </label>
      </div>

      <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
        {copy.account.communicationHint}
      </p>

      <button type="submit" className="btn-primary px-6" disabled={isPending}>
        {isPending
          ? copy.account.communicationSavePending
          : copy.account.communicationSaveIdle}
      </button>

      {status ? (
        <StatusNotice tone={status.type} align="left">
          {status.message}
        </StatusNotice>
      ) : null}
    </form>
  )
}
