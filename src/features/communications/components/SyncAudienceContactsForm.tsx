"use client";

import { useActionState } from "react";

import { syncAudienceContactsWithResend } from "@/actions/admin";
import type { SyncAudienceContactsState } from "@/actions/admin/states";
import { Button } from "@/components/Button";
import { StatusNotice } from "@/components/StatusNotice";

export function SyncAudienceContactsForm() {
  const [state, formAction, isPending] = useActionState<
    SyncAudienceContactsState | null,
    FormData
  >(syncAudienceContactsWithResend, null);

  return (
    <form action={formAction} className="space-y-4">
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Syncing audience..." : "Sync audience to Resend"}
      </Button>

      {state?.message ? (
        <StatusNotice tone={state.success ? "success" : "error"} align="left">
          {state.message}
        </StatusNotice>
      ) : null}
    </form>
  );
}
