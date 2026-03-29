import { Badge } from "@/components/Badge";
import type { NotificationEventRow } from "@/features/notifications/lib/notifications";

type NotificationEventStatusBadgeProps = {
  status: NotificationEventRow["status"];
};

const STATUS_CONFIG: Record<
  NotificationEventRow["status"],
  {
    label: string;
    tone: "accent" | "coptic" | "neutral";
  }
> = {
  failed: {
    label: "Failed",
    tone: "accent",
  },
  queued: {
    label: "Queued",
    tone: "neutral",
  },
  sent: {
    label: "Sent",
    tone: "coptic",
  },
};

export function NotificationEventStatusBadge({
  status,
}: NotificationEventStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge tone={config.tone} size="xs">
      {config.label}
    </Badge>
  );
}
