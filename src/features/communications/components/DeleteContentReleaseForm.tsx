"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";

import { deleteContentReleaseDraft } from "@/actions/admin";
import type { DeleteContentReleaseState } from "@/actions/admin/states";
import { Button } from "@/components/Button";
import { StatusNotice } from "@/components/StatusNotice";
import {
  isContentReleaseDeletableStatus,
  type ContentReleaseRow,
} from "@/features/communications/lib/releases";

export function DeleteContentReleaseForm({
  releaseId,
  status,
}: {
  releaseId: string;
  status: ContentReleaseRow["status"];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    DeleteContentReleaseState | null,
    FormData
  >(deleteContentReleaseDraft, null);
  let buttonLabel = "Delete draft";

  if (isPending) {
    buttonLabel = "Deleting draft...";
  } else if (state?.success) {
    buttonLabel = "Refreshing...";
  }

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }, [router, state?.success]);

  if (!isContentReleaseDeletableStatus(status)) {
    return null;
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-5 dark:border-rose-900/40 dark:bg-rose-950/20"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this release draft and its snapshotted items permanently? Sent or in-flight releases cannot be removed this way.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="release_id" value={releaseId} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
            Remove unsent draft
          </p>
          <p className="text-sm leading-6 text-rose-700 dark:text-rose-200">
            Use this for abandoned test drafts or cancelled announcements you do
            not want cluttering communications history.
          </p>
        </div>

        <Button
          type="submit"
          variant="secondary"
          className="border-rose-200 bg-white/90 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/10 dark:text-rose-200 dark:hover:bg-rose-950/30"
          disabled={isPending || state?.success === true}
        >
          {buttonLabel}
        </Button>
      </div>

      {state?.message && !state.success ? (
        <StatusNotice tone="error" align="left">
          {state.message}
        </StatusNotice>
      ) : null}
    </form>
  );
}
