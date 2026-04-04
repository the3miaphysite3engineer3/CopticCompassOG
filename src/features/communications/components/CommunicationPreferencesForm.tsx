"use client";

import { useState, useTransition } from "react";
import { updateCommunicationPreferences } from "@/actions/communications";
import { Button } from "@/components/Button";
import { CheckboxField } from "@/components/CheckboxField";
import { FormField, FormHint } from "@/components/FormField";
import { StatusNotice } from "@/components/StatusNotice";
import { useLanguage } from "@/components/LanguageProvider";
import { getDashboardCopy } from "@/features/dashboard/lib/dashboardCopy";
import type { AudiencePreferences } from "@/features/communications/lib/communications";

type CommunicationPreferencesFormProps = {
  deliveryEmail: string | null;
  preferences: AudiencePreferences;
};

export function CommunicationPreferencesForm({
  deliveryEmail,
  preferences,
}: CommunicationPreferencesFormProps) {
  const { language } = useLanguage();
  const copy = getDashboardCopy(language);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setStatus(null);

    startTransition(async () => {
      const result = await updateCommunicationPreferences(formData);
      setStatus({
        message:
          result.message ??
          (result.success
            ? copy.account.communicationSaveIdle
            : copy.account.communicationDescription),
        type: result.success ? "success" : "error",
      });
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-6 text-stone-800 dark:text-stone-200"
    >
      <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
        {copy.account.communicationLead}
      </p>

      <FormField
        htmlFor="communication_email"
        label={copy.account.communicationEmailLabel}
      >
        <input
          id="communication_email"
          type="email"
          className="input-base bg-stone-50 text-stone-500 dark:bg-stone-900"
          defaultValue={deliveryEmail ?? ""}
          disabled
        />
      </FormField>

      <FormField htmlFor="locale" label={copy.account.communicationLocaleLabel}>
        <select
          id="locale"
          name="locale"
          defaultValue={preferences.locale}
          className="select-base"
        >
          <option value="en">English</option>
          <option value="nl">Nederlands</option>
        </select>
        <FormHint>{copy.account.communicationLocaleHint}</FormHint>
      </FormField>

      <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/30">
        <CheckboxField
          name="lessons_opt_in"
          value="true"
          defaultChecked={preferences.lessonsOptIn}
          label={copy.account.communicationLessonsLabel}
          wrapperClassName="-m-2"
        />

        <CheckboxField
          name="books_opt_in"
          value="true"
          defaultChecked={preferences.booksOptIn}
          label={copy.account.communicationBooksLabel}
          wrapperClassName="-m-2"
        />

        <CheckboxField
          name="general_updates_opt_in"
          value="true"
          defaultChecked={preferences.generalUpdatesOptIn}
          label={copy.account.communicationGeneralLabel}
          wrapperClassName="-m-2"
        />
      </div>

      <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
        {copy.account.communicationHint}
      </p>

      <Button type="submit" disabled={isPending}>
        {isPending
          ? copy.account.communicationSavePending
          : copy.account.communicationSaveIdle}
      </Button>

      {status ? (
        <StatusNotice tone={status.type} align="left">
          {status.message}
        </StatusNotice>
      ) : null}
    </form>
  );
}
