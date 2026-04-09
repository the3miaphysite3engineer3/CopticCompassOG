import { Badge } from "@/components/Badge";
import { SurfacePanel } from "@/components/SurfacePanel";
import {
  formatNotificationAggregateType,
  formatNotificationEventType,
  formatNotificationTimestamp,
  getNotificationContextBadges,
  type AdminNotificationEvent,
} from "@/features/notifications/lib/notifications";

import { NotificationEventStatusBadge } from "./NotificationEventStatusBadge";

type AdminNotificationEventCardProps = {
  event: AdminNotificationEvent;
};

export function AdminNotificationEventCard({
  event,
}: AdminNotificationEventCardProps) {
  const contextBadges = getNotificationContextBadges(event);

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
            <NotificationEventStatusBadge status={event.status} />
            <Badge tone="surface" size="xs">
              {formatNotificationEventType(event.event_type)}
            </Badge>
            <Badge tone="neutral" size="xs">
              {formatNotificationAggregateType(event.aggregate_type)}
            </Badge>
          </div>

          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {event.subject}
          </h2>

          <div className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <p>
              Recipient:{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {event.recipient}
              </span>
            </p>
            <p>Created on {formatNotificationTimestamp(event.created_at)}</p>
            {event.processed_at ? (
              <p>
                Processed on {formatNotificationTimestamp(event.processed_at)}
              </p>
            ) : null}
            <p>
              Aggregate: {formatNotificationAggregateType(event.aggregate_type)}{" "}
              #{event.aggregate_id}
            </p>
            {event.latestDelivery?.provider_message_id ? (
              <p>
                Provider message ID: {event.latestDelivery.provider_message_id}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {contextBadges.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {contextBadges.map((badge) => (
            <Badge key={badge} tone="flat" size="xs">
              {badge}
            </Badge>
          ))}
        </div>
      ) : null}

      {event.status === "failed" && event.last_error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <span className="font-semibold">Last error:</span> {event.last_error}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-100 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-600 dark:border-stone-800/50 dark:bg-stone-950 dark:text-stone-300">
          Latest delivery status:{" "}
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {event.latestDelivery?.status ?? event.status}
          </span>
        </div>
      )}
    </SurfacePanel>
  );
}
