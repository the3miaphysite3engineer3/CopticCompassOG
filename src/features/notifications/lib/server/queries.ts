import {
  compareAdminNotificationPriority,
  type AdminNotificationEvent,
  type NotificationDeliveryRow,
} from "@/features/notifications/lib/notifications";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

export async function getAdminNotificationEvents(
  supabase: AppSupabaseClient,
  limit = 18,
): Promise<QueryResult<AdminNotificationEvent[]>> {
  const notificationEventsResult = await supabase
    .from("notification_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (notificationEventsResult.error || !notificationEventsResult.data) {
    return {
      data: null,
      error: notificationEventsResult.error
        ? { message: notificationEventsResult.error.message }
        : { message: "Could not load notification activity." },
    };
  }

  if (notificationEventsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const eventIds = notificationEventsResult.data.map((event) => event.id);
  const deliveriesResult = await supabase
    .from("notification_deliveries")
    .select("*")
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  if (deliveriesResult.error) {
    return {
      data: null,
      error: { message: deliveriesResult.error.message },
    };
  }

  const deliveriesByEventId = new Map<string, NotificationDeliveryRow[]>();

  for (const delivery of deliveriesResult.data ?? []) {
    const deliveries = deliveriesByEventId.get(delivery.event_id) ?? [];
    deliveries.push(delivery);
    deliveriesByEventId.set(delivery.event_id, deliveries);
  }

  return {
    data: notificationEventsResult.data
      .map((event) => {
        const deliveries = deliveriesByEventId.get(event.id) ?? [];
        return {
          ...event,
          deliveries,
          latestDelivery: deliveries[0] ?? null,
        };
      })
      .sort(compareAdminNotificationPriority),
    error: null,
  };
}
