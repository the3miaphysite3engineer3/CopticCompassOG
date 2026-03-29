import { updateContactMessageStatus } from "@/actions/admin";
import { FormField } from "@/components/FormField";
import {
  CONTACT_MESSAGE_STATUSES,
  formatContactMessageStatus,
  type ContactMessageStatus,
} from "@/features/contact/lib/contact";

type ContactMessageReviewFormProps = {
  contactMessageId: string;
  status: ContactMessageStatus;
};

export function ContactMessageReviewForm({
  contactMessageId,
  status,
}: ContactMessageReviewFormProps) {
  return (
    <form
      action={updateContactMessageStatus}
      className="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/60 p-5 dark:border-stone-800 dark:bg-stone-900/20"
    >
      <input
        type="hidden"
        name="contact_message_id"
        value={contactMessageId}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <FormField
          htmlFor={`contact-message-status-${contactMessageId}`}
          label="Inbox status"
          labelTone="muted"
          className="min-w-[14rem] flex-1"
        >
          <select
            id={`contact-message-status-${contactMessageId}`}
            name="status"
            defaultValue={status}
            className="select-base h-11 rounded-xl text-sm"
          >
            {CONTACT_MESSAGE_STATUSES.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>
                {formatContactMessageStatus(nextStatus)}
              </option>
            ))}
          </select>
        </FormField>

        <button type="submit" className="btn-primary px-5">
          Save status
        </button>
      </div>
    </form>
  );
}
