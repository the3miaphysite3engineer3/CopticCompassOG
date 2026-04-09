"use client";

import { useActionState } from "react";

import { sendContentRelease } from "@/actions/admin";
import type { SendContentReleaseState } from "@/actions/admin/states";
import { StatusNotice } from "@/components/StatusNotice";
import type { ContentReleaseRow } from "@/features/communications/lib/releases";

export function SendContentReleaseForm({
  releaseId,
  status,
}: {
  releaseId: string;
  status: ContentReleaseRow["status"];
}) {
  const [state, formAction, isPending] = useActionState<
    SendContentReleaseState | null,
    FormData
  >(sendContentRelease, null);

  if (status === "sent") {
    return (
      <StatusNotice tone="success" align="left">
        This release is already marked as sent.
      </StatusNotice>
    );
  }

  if (status === "queued") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="release_id" value={releaseId} />

        <StatusNotice tone="info" align="left">
          This release is queued for background delivery. You can resume the
          worker if it stalls.
        </StatusNotice>

        <button type="submit" className="btn-primary px-6" disabled={isPending}>
          {isPending ? "Resuming release..." : "Resume queued delivery"}
        </button>

        {state?.message ? (
          <StatusNotice tone={state.success ? "success" : "error"} align="left">
            {state.message}
          </StatusNotice>
        ) : null}
      </form>
    );
  }

  if (status === "sending") {
    return (
      <StatusNotice tone="info" align="left">
        This release is currently being delivered in the background.
      </StatusNotice>
    );
  }

  if (status !== "approved") {
    return (
      <StatusNotice tone="info" align="left">
        Approve the draft before queueing it for subscribers.
      </StatusNotice>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="release_id" value={releaseId} />

      <button type="submit" className="btn-primary px-6" disabled={isPending}>
        {isPending ? "Queueing release..." : "Queue release send"}
      </button>

      {state?.message ? (
        <StatusNotice tone={state.success ? "success" : "error"} align="left">
          {state.message}
        </StatusNotice>
      ) : null}
    </form>
  );
}
