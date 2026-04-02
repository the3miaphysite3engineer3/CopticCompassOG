import type { Metadata } from "next";
import { updatePassword } from "@/actions/auth";
import { FormField } from "@/components/FormField";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";
import { AuthFlashNoticeCleaner } from "@/features/auth/components/AuthFlashNoticeCleaner";
import { getTranslation } from "@/lib/i18n";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();

  return createNoIndexMetadata({
    title: getTranslation(language, "update.metaTitle"),
    description: getTranslation(language, "update.metaDescription"),
  });
}

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    messageType?: "error" | "success" | "info";
    state?: string;
  }>;
}) {
  const language = await getPreferredLanguage();
  await requireAuthenticatedPageSession("/update-password");

  const noticeMessages: Record<string, string> = {
    "update-invalid-input": getTranslation(
      language,
      "update.notice.invalidInput",
    ),
    "update-error": getTranslation(language, "update.notice.error"),
    "update-rate-limited": getTranslation(
      language,
      "update.notice.rateLimited",
    ),
  };
  const { messageType = "error", state } = await searchParams;
  const noticeMessage =
    state && state in noticeMessages ? noticeMessages[state] : undefined;
  const noticeVariant = messageType;

  return (
    <PageShell
      className="min-h-screen px-6 py-16 md:px-10"
      contentClassName="mx-auto max-w-3xl pt-8"
      accents={[
        pageShellAccents.topLeftSkyOrb,
        pageShellAccents.bottomRightEmeraldOrb,
      ]}
    >
      <PageHeader
        title={getTranslation(language, "update.title")}
        description={getTranslation(language, "update.subtitle")}
        tone="brand"
        className="mb-12"
      />

      <AuthFlashNoticeCleaner />

      <div className="mx-auto max-w-xl">
        <SurfacePanel rounded="3xl" className="p-8 md:p-10">
          <form className="space-y-6 text-stone-800 dark:text-stone-200">
            <FormField
              htmlFor="password"
              label={getTranslation(language, "update.password")}
            >
              <input
                id="password"
                className="input-base"
                type="password"
                name="password"
                minLength={8}
                placeholder={getTranslation(
                  language,
                  "update.passwordPlaceholder",
                )}
                required
              />
            </FormField>

            <div className="space-y-3 pt-2">
              <button
                formAction={updatePassword}
                className="btn-primary w-full"
              >
                {getTranslation(language, "update.submit")}
              </button>
            </div>

            {noticeMessage && (
              <StatusNotice tone={noticeVariant}>{noticeMessage}</StatusNotice>
            )}
          </form>
        </SurfacePanel>
      </div>
    </PageShell>
  );
}
