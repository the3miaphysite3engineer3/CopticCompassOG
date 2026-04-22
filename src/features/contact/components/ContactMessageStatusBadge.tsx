"use client";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import {
  formatContactMessageStatus,
  type ContactMessageStatus,
} from "@/features/contact/lib/contact";

type ContactMessageStatusBadgeProps = {
  status: ContactMessageStatus;
};

const STATUS_TONES: Record<
  ContactMessageStatus,
  "accent" | "coptic" | "neutral" | "surface"
> = {
  new: "accent",
  in_progress: "surface",
  answered: "coptic",
  archived: "neutral",
};

export function ContactMessageStatusBadge({
  status,
}: ContactMessageStatusBadgeProps) {
  const { language } = useLanguage();

  return (
    <Badge tone={STATUS_TONES[status]} size="xs">
      {formatContactMessageStatus(status, language)}
    </Badge>
  );
}
