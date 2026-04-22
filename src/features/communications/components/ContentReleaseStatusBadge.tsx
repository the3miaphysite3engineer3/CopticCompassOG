"use client";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import type { ContentReleaseRow } from "@/features/communications/lib/releases";
import { formatContentReleaseStatus } from "@/features/communications/lib/releases";

export function ContentReleaseStatusBadge({
  status,
}: {
  status: ContentReleaseRow["status"];
}) {
  const { language } = useLanguage();
  let tone: "accent" | "coptic" | "flat" | "neutral" | "surface" = "flat";

  if (status === "draft") {
    tone = "surface";
  } else if (status === "approved" || status === "queued") {
    tone = "accent";
  } else if (status === "sending") {
    tone = "neutral";
  } else if (status === "sent") {
    tone = "coptic";
  }

  return (
    <Badge tone={tone} size="xs">
      {formatContentReleaseStatus(status, language)}
    </Badge>
  );
}
