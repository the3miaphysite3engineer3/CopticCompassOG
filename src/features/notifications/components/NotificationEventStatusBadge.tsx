"use client";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
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
  const { language } = useLanguage();
  const config = STATUS_CONFIG[status];
  const label =
    language === "nl"
      ? (
          {
            failed: "Mislukt",
            queued: "In wachtrij",
            sent: "Verzonden",
          } satisfies Record<NotificationEventRow["status"], string>
        )[status]
      : config.label;

  return (
    <Badge tone={config.tone} size="xs">
      {label}
    </Badge>
  );
}
