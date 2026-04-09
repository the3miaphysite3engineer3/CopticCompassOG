import { Badge } from "@/components/Badge";
import { SurfacePanel } from "@/components/SurfacePanel";
import {
  getAudienceLocaleLabel,
  getAudienceSourceLabel,
  hasAudienceSubscriptions,
  type AdminAudienceContactRow,
} from "@/features/communications/lib/communications";

function formatAdminAudienceDate(value: string | null) {
  if (!value) {
    return "Not recorded yet";
  }

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminAudienceContactCard({
  contact,
}: {
  contact: AdminAudienceContactRow;
}) {
  const isSubscribed = hasAudienceSubscriptions(contact);
  const syncState = contact.syncState;
  let syncTone: "coptic" | "neutral" | "surface" = "surface";
  let syncLabel = "Resend pending";

  if (syncState?.last_error) {
    syncTone = "neutral";
    syncLabel = "Resend error";
  } else if (syncState?.last_synced_at) {
    syncTone = "coptic";
    syncLabel = "Resend synced";
  }

  return (
    <SurfacePanel rounded="3xl" className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {contact.full_name || contact.email}
          </h3>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {contact.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={isSubscribed ? "accent" : "neutral"} size="xs">
            {isSubscribed ? "Subscribed" : "Paused"}
          </Badge>
          <Badge tone={syncTone} size="xs">
            {syncLabel}
          </Badge>
          <Badge tone="surface" size="xs">
            {getAudienceSourceLabel(contact.source)}
          </Badge>
          <Badge tone="coptic" size="xs">
            {getAudienceLocaleLabel(contact.locale)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {contact.lessons_opt_in ? (
          <Badge tone="accent" size="xs">
            Lessons
          </Badge>
        ) : null}
        {contact.books_opt_in ? (
          <Badge tone="accent" size="xs">
            Books
          </Badge>
        ) : null}
        {contact.general_updates_opt_in ? (
          <Badge tone="accent" size="xs">
            General updates
          </Badge>
        ) : null}
        {!contact.lessons_opt_in &&
        !contact.books_opt_in &&
        !contact.general_updates_opt_in ? (
          <Badge tone="neutral" size="xs">
            No active topics
          </Badge>
        ) : null}
      </div>

      <dl className="grid gap-3 text-sm text-stone-600 dark:text-stone-300 md:grid-cols-2">
        <div>
          <dt className="font-semibold text-stone-800 dark:text-stone-100">
            Consented
          </dt>
          <dd>{formatAdminAudienceDate(contact.consented_at)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-800 dark:text-stone-100">
            Last changed
          </dt>
          <dd>{formatAdminAudienceDate(contact.updated_at)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-800 dark:text-stone-100">
            Resend synced
          </dt>
          <dd>{formatAdminAudienceDate(syncState?.last_synced_at ?? null)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-800 dark:text-stone-100">
            Resend status
          </dt>
          <dd>{syncState?.last_error ?? "Ready"}</dd>
        </div>
      </dl>
    </SurfacePanel>
  );
}
