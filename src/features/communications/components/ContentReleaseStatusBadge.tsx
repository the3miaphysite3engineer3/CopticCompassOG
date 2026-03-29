import { Badge } from '@/components/Badge'
import type { ContentReleaseRow } from '@/features/communications/lib/releases'
import { formatContentReleaseStatus } from '@/features/communications/lib/releases'

export function ContentReleaseStatusBadge({
  status,
}: {
  status: ContentReleaseRow['status']
}) {
  const tone =
    status === 'draft'
      ? 'surface'
      : status === 'approved' || status === 'queued'
        ? 'accent'
        : status === 'sending'
          ? 'neutral'
          : status === 'sent'
            ? 'coptic'
            : 'flat'

  return (
    <Badge tone={tone} size="xs">
      {formatContentReleaseStatus(status)}
    </Badge>
  )
}
