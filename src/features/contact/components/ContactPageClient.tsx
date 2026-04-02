"use client";

import { useActionState } from "react";
import { ArrowRight, Mail, MessageSquare, User } from "lucide-react";
import { sendContactEmail, type ContactFormState } from "@/actions/contact";
import { contactInquiryOptions } from "@/features/contact/lib/contact";
import { useLanguage } from "@/components/LanguageProvider";
import { FormField } from "@/components/FormField";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";

export default function ContactPageClient() {
  const { language, t } = useLanguage();
  const [state, formAction, isPending] = useActionState<
    ContactFormState | null,
    FormData
  >(sendContactEmail, null);

  return (
    <PageShell
      className="min-h-screen px-6 py-16 md:px-10"
      contentClassName="max-w-3xl mx-auto pt-8"
      accents={[
        pageShellAccents.topLeftSkyOrb,
        pageShellAccents.bottomRightEmeraldOrb,
      ]}
    >
      <PageHeader
        title={t("contact.title")}
        description={t("contact.subtitle")}
        tone="brand"
        className="mb-12"
      />

      <SurfacePanel rounded="3xl" className="p-8 md:p-10">
        <form action={formAction} className="space-y-8">
          <input
            type="text"
            name="website"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />
          <input type="hidden" name="locale" value={language} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField htmlFor="name" label={t("contact.name")}>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                  size={20}
                />
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  className="input-base pl-12"
                  placeholder={t("contact.namePlaceholder")}
                />
              </div>
            </FormField>

            <FormField htmlFor="email" label={t("contact.email")}>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="input-base pl-12"
                  placeholder={t("contact.emailPlaceholder")}
                />
              </div>
            </FormField>
          </div>

          <FormField htmlFor="inquiryType" label={t("contact.inquiry")}>
            <select
              id="inquiryType"
              name="inquiryType"
              required
              defaultValue=""
              className="select-base"
            >
              <option value="" disabled>
                {t("contact.select")}
              </option>
              {contactInquiryOptions.map((option) => {
                const optionLabel = t(option.labelKey);
                return (
                  <option key={option.value} value={option.value}>
                    {optionLabel}
                  </option>
                );
              })}
            </select>
          </FormField>

          <FormField htmlFor="message" label={t("contact.message")}>
            <div className="relative">
              <MessageSquare
                className="absolute left-4 top-4 text-stone-400 dark:text-stone-500"
                size={20}
              />
              <textarea
                id="message"
                name="message"
                required
                rows={7}
                className="textarea-base resize-y pl-12"
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>
          </FormField>

          <FormField
            htmlFor="wants_updates"
            label={t("contact.updatesLabel")}
            className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-950/30"
          >
            <label
              htmlFor="wants_updates"
              className="flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300"
            >
              <input
                id="wants_updates"
                type="checkbox"
                name="wants_updates"
                value="true"
                className="mt-1 h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-950"
              />
              <span>{t("contact.updatesHint")}</span>
            </label>
          </FormField>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full gap-3"
          >
            {isPending ? t("contact.sending") : t("contact.send")}
            <ArrowRight size={20} />
          </button>

          {state?.success && (
            <StatusNotice tone="success">
              {state.message ?? t("contact.success")}
            </StatusNotice>
          )}

          {state?.error && (
            <StatusNotice tone="error">{state.error}</StatusNotice>
          )}
        </form>
      </SurfacePanel>
    </PageShell>
  );
}
