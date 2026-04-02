import { Badge } from "@/components/Badge";
import { SurfacePanel } from "@/components/SurfacePanel";
import {
  formatContentReleaseAudienceSegment,
  formatContentReleaseLocaleMode,
  formatContentReleaseType,
  getContentReleaseDeliverySummary,
  type AdminContentRelease,
} from "@/features/communications/lib/releases";
import { ContentReleaseReviewForm } from "./ContentReleaseReviewForm";
import { ContentReleaseStatusBadge } from "./ContentReleaseStatusBadge";
import { SendContentReleaseForm } from "./SendContentReleaseForm";
import { SendContentReleasePreviewForm } from "./SendContentReleasePreviewForm";

function formatContentReleaseTimestamp(
  timestamp: string | null,
  emptyLabel = "Not sent yet",
) {
  if (!timestamp) {
    return emptyLabel;
  }

  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminContentReleaseCard({
  release,
}: {
  release: AdminContentRelease;
}) {
  const deliverySummary = getContentReleaseDeliverySummary(release);

  return (
    <SurfacePanel
      as="article"
      rounded="3xl"
      variant="elevated"
      className="p-6 md:p-8"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ContentReleaseStatusBadge status={release.status} />
            <Badge tone="surface" size="xs">
              {formatContentReleaseType(release.release_type)}
            </Badge>
            <Badge tone="neutral" size="xs">
              {formatContentReleaseAudienceSegment(release.audience_segment)}
            </Badge>
            <Badge tone="coptic" size="xs">
              {formatContentReleaseLocaleMode(release.locale_mode)}
            </Badge>
          </div>

          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {release.subject_en ??
              release.subject_nl ??
              "Untitled release draft"}
          </h2>

          <div className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <p>
              Updated on {formatContentReleaseTimestamp(release.updated_at)}
            </p>
            <p>
              Created on {formatContentReleaseTimestamp(release.created_at)}
            </p>
            {release.delivery_requested_at ? (
              <p>
                Delivery requested on{" "}
                {formatContentReleaseTimestamp(release.delivery_requested_at)}
              </p>
            ) : null}
            {release.delivery_started_at ? (
              <p>
                Delivery started on{" "}
                {formatContentReleaseTimestamp(release.delivery_started_at)}
              </p>
            ) : null}
            {release.delivery_finished_at ? (
              <p>
                Delivery finished on{" "}
                {formatContentReleaseTimestamp(release.delivery_finished_at)}
              </p>
            ) : null}
            {release.sent_at ? (
              <p>Sent on {formatContentReleaseTimestamp(release.sent_at)}</p>
            ) : null}
            <p>Snapshot items: {release.items.length}</p>
            {typeof deliverySummary.eligibleRecipientCount === "number" ? (
              <p>
                Eligible recipients: {deliverySummary.eligibleRecipientCount}
              </p>
            ) : null}
            {typeof deliverySummary.processedRecipientCount === "number" ? (
              <p>
                Processed recipients: {deliverySummary.processedRecipientCount}
                {typeof deliverySummary.remainingRecipientCount === "number"
                  ? `, remaining ${deliverySummary.remainingRecipientCount}`
                  : ""}
              </p>
            ) : null}
            {typeof deliverySummary.sentCount === "number" ||
            typeof deliverySummary.skippedCount === "number" ||
            typeof deliverySummary.failedCount === "number" ? (
              <p>
                Delivery counts: sent {deliverySummary.sentCount ?? 0}, skipped{" "}
                {deliverySummary.skippedCount ?? 0}, failed{" "}
                {deliverySummary.failedCount ?? 0}
              </p>
            ) : null}
            {deliverySummary.broadcasts?.length ? (
              <div className="space-y-1">
                {deliverySummary.broadcasts.map((broadcast) => (
                  <p key={broadcast.id}>
                    Broadcast {broadcast.language.toUpperCase()}:{" "}
                    {broadcast.recipientCount} recipients, id {broadcast.id}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {release.last_delivery_error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {release.last_delivery_error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 dark:border-stone-800/50 dark:bg-stone-950">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            English copy
          </p>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {release.subject_en ?? "Not set"}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600 dark:text-stone-300">
            {release.body_en ?? "No English body saved yet."}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 dark:border-stone-800/50 dark:bg-stone-950">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Dutch copy
          </p>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {release.subject_nl ?? "Niet ingesteld"}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600 dark:text-stone-300">
            {release.body_nl ?? "Nog geen Nederlandse tekst opgeslagen."}
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Snapshotted items
        </p>
        <div className="space-y-3">
          {release.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-stone-100 bg-stone-50 px-5 py-4 dark:border-stone-800/50 dark:bg-stone-950"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="surface" size="xs">
                  {item.item_type === "lesson" ? "Lesson" : "Publication"}
                </Badge>
                <Badge tone="neutral" size="xs">
                  {item.item_id}
                </Badge>
              </div>
              <p className="mt-3 text-base font-semibold text-stone-900 dark:text-stone-100">
                {item.title_snapshot}
              </p>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                {item.url_snapshot}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SendContentReleasePreviewForm releaseId={release.id} />
        <ContentReleaseReviewForm
          releaseId={release.id}
          status={release.status}
        />
        <SendContentReleaseForm
          releaseId={release.id}
          status={release.status}
        />
      </div>
    </SurfacePanel>
  );
}
