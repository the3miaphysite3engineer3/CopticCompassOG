import { updateContentReleaseStatus } from "@/actions/admin";
import { FormField } from "@/components/FormField";
import { StatusNotice } from "@/components/StatusNotice";
import {
  CONTENT_RELEASE_EDITABLE_STATUSES,
  formatContentReleaseStatus,
  type ContentReleaseRow,
} from "@/features/communications/lib/releases";

export function ContentReleaseReviewForm({
  releaseId,
  status,
}: {
  releaseId: string;
  status: ContentReleaseRow["status"];
}) {
  if (status === "queued") {
    return (
      <StatusNotice tone="info" align="left">
        This release is queued for background delivery. Status changes are
        locked until the worker starts.
      </StatusNotice>
    );
  }

  if (status === "sending") {
    return (
      <StatusNotice tone="info" align="left">
        This release is currently being delivered in the background.
      </StatusNotice>
    );
  }

  if (status === "sent") {
    return (
      <StatusNotice tone="success" align="left">
        This release has already finished delivering.
      </StatusNotice>
    );
  }

  const editableStatus =
    status === "draft" || status === "approved" || status === "cancelled"
      ? status
      : "draft";

  return (
    <form
      action={updateContentReleaseStatus}
      className="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/60 p-5 dark:border-stone-800 dark:bg-stone-900/20"
    >
      <input type="hidden" name="release_id" value={releaseId} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <FormField
          htmlFor={`content-release-status-${releaseId}`}
          label="Draft status"
          labelTone="muted"
          className="min-w-[14rem] flex-1"
        >
          <select
            id={`content-release-status-${releaseId}`}
            name="status"
            defaultValue={editableStatus}
            className="select-base h-11 rounded-xl text-sm"
          >
            {CONTENT_RELEASE_EDITABLE_STATUSES.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>
                {formatContentReleaseStatus(nextStatus)}
              </option>
            ))}
          </select>
        </FormField>

        <button type="submit" className="btn-primary px-5">
          Save draft state
        </button>
      </div>
    </form>
  );
}
