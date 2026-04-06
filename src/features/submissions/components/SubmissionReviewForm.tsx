import { submitFeedback } from "@/actions/admin";
import { Button } from "@/components/Button";
import { FormField, FormLabel } from "@/components/FormField";
import type { SubmissionRow } from "@/features/submissions/types";

type SubmissionReviewFormProps = {
  submission: SubmissionRow;
};

export function SubmissionReviewForm({
  submission,
}: SubmissionReviewFormProps) {
  return (
    <form
      action={submitFeedback}
      className="space-y-6 rounded-2xl border border-stone-100 bg-stone-50/50 p-6 dark:border-stone-800 dark:bg-stone-900/20"
    >
      <input type="hidden" name="submission_id" value={submission.id} />
      <h4 className="font-bold text-stone-700 dark:text-stone-300">
        Evaluate Translation
      </h4>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <FormLabel>Score (1-5):</FormLabel>
        <input
          type="number"
          name="rating"
          min="1"
          max="5"
          defaultValue={submission.rating ?? 5}
          required
          className="input-base h-auto w-24 rounded-xl px-4 py-2 text-center font-bold"
        />
      </div>

      <FormField label="Instructor Notes / Corrections:">
        <textarea
          name="feedback"
          rows={4}
          defaultValue={submission.feedback_text ?? ""}
          className="textarea-base min-h-0 resize-y px-5 py-4"
          placeholder="Type your notes for the student..."
          required
        />
      </FormField>

      <Button type="submit" fullWidth className="sm:w-auto" size="lg">
        {submission.status === "reviewed"
          ? "Save Updated Feedback"
          : "Mark Reviewed & Send Feedback"}
      </Button>
    </form>
  );
}
