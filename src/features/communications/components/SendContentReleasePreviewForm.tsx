"use client";

import { useActionState } from "react";
import {
  sendContentReleasePreview,
  type SendContentReleaseState,
} from "@/actions/admin";
import { FormField } from "@/components/FormField";
import { StatusNotice } from "@/components/StatusNotice";

export function SendContentReleasePreviewForm({
  releaseId,
}: {
  releaseId: string;
}) {
  const [state, formAction, isPending] = useActionState<
    SendContentReleaseState | null,
    FormData
  >(sendContentReleasePreview, null);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/60 p-5 dark:border-stone-800 dark:bg-stone-900/20"
    >
      <input type="hidden" name="release_id" value={releaseId} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <FormField
          htmlFor={`content-release-preview-locale-${releaseId}`}
          label="Preview locale"
          labelTone="muted"
          className="min-w-[14rem] flex-1"
        >
          <select
            id={`content-release-preview-locale-${releaseId}`}
            name="preview_locale"
            defaultValue="en"
            className="select-base h-11 rounded-xl text-sm"
          >
            <option value="en">English preview</option>
            <option value="nl">Dutch preview</option>
          </select>
        </FormField>

        <button
          type="submit"
          className="btn-secondary px-5"
          disabled={isPending}
        >
          {isPending ? "Sending preview..." : "Send preview email"}
        </button>
      </div>

      <p className="text-sm text-stone-500 dark:text-stone-400">
        Sends a preview to the configured admin inbox without marking the
        release as sent.
      </p>

      {state?.message ? (
        <StatusNotice tone={state.success ? "success" : "error"} align="left">
          {state.message}
        </StatusNotice>
      ) : null}
    </form>
  );
}
