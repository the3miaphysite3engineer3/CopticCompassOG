import { Badge } from "@/components/Badge";
import { SurfacePanel } from "@/components/SurfacePanel";
import {
  formatContactInquiryLabel,
  type ContactMessageRow,
} from "@/features/contact/lib/contact";
import { formatSubmissionDate } from "@/features/submissions/utils";
import { ContactMessageReviewForm } from "./ContactMessageReviewForm";
import { ContactMessageStatusBadge } from "./ContactMessageStatusBadge";

type AdminContactMessageCardProps = {
  message: ContactMessageRow;
};

function formatLocaleLabel(locale: ContactMessageRow["locale"]) {
  return locale === "nl" ? "Dutch" : "English";
}

export function AdminContactMessageCard({
  message,
}: AdminContactMessageCardProps) {
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
            <ContactMessageStatusBadge status={message.status} />
            <Badge tone="surface" size="xs">
              {formatContactInquiryLabel(message.inquiry_type)}
            </Badge>
            <Badge tone="neutral" size="xs">
              {formatLocaleLabel(message.locale)}
            </Badge>
            {message.wants_updates ? (
              <Badge tone="coptic" size="xs">
                Wants updates
              </Badge>
            ) : null}
          </div>

          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {message.name}
          </h2>

          <div className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <p>
              Email:{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {message.email}
              </span>
            </p>
            <p>
              Received on{" "}
              {formatSubmissionDate(message.created_at, message.locale)}
            </p>
            {message.responded_at ? (
              <p>
                Marked answered on{" "}
                {formatSubmissionDate(message.responded_at, message.locale)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <a href={`mailto:${message.email}`} className="btn-secondary px-5">
            Reply by email
          </a>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-100 bg-stone-50 p-5 text-base leading-7 whitespace-pre-wrap text-stone-700 dark:border-stone-800/50 dark:bg-stone-950 dark:text-stone-300">
        {message.message}
      </div>

      <ContactMessageReviewForm
        contactMessageId={message.id}
        status={message.status}
      />
    </SurfacePanel>
  );
}
