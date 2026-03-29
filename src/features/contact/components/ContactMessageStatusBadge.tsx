import { Badge } from "@/components/Badge";
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
  return (
    <Badge tone={STATUS_TONES[status]} size="xs">
      {formatContactMessageStatus(status)}
    </Badge>
  );
}
