'use client'

import { useActionState } from 'react'
import {
  syncAudienceContactsWithResend,
  type SyncAudienceContactsState,
} from '@/actions/admin'
import { StatusNotice } from '@/components/StatusNotice'

export function SyncAudienceContactsForm() {
  const [state, formAction, isPending] = useActionState<SyncAudienceContactsState | null, FormData>(
    syncAudienceContactsWithResend,
    null,
  )

  return (
    <form action={formAction} className="space-y-4">
      <button type="submit" className="btn-secondary px-6" disabled={isPending}>
        {isPending ? 'Syncing audience...' : 'Sync audience to Resend'}
      </button>

      {state?.message ? (
        <StatusNotice tone={state.success ? 'success' : 'error'} align="left">
          {state.message}
        </StatusNotice>
      ) : null}
    </form>
  )
}
