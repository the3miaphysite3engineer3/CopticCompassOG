import type { Metadata } from "next";
import { resetPassword } from "@/actions/auth";
import { FormField } from "@/components/FormField";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";
import { getTranslation } from "@/lib/i18n";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getPreferredLanguage } from "@/lib/server/preferredLanguage";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPreferredLanguage();

  return createNoIndexMetadata({
    title: getTranslation(language, "forgot.metaTitle"),
    description: getTranslation(language, "forgot.metaDescription"),
  });
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    messageType?: "error" | "success" | "info";
    state?: string;
  }>;
}) {
  const language = await getPreferredLanguage();
  const noticeMessages: Record<string, string> = {
    "forgot-invalid-input": getTranslation(
      language,
      "forgot.notice.invalidInput",
    ),
    "forgot-error": getTranslation(language, "forgot.notice.error"),
    "forgot-rate-limited": getTranslation(
      language,
      "forgot.notice.rateLimited",
    ),
    "forgot-success": getTranslation(language, "forgot.notice.success"),
  };
  const { messageType = "error", state } = await searchParams;
  const noticeMessage =
    state && state in noticeMessages ? noticeMessages[state] : undefined;
  const noticeVariant = state === "forgot-success" ? "success" : messageType;

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
        title={getTranslation(language, "forgot.title")}
        description={getTranslation(language, "forgot.subtitle")}
        tone="brand"
        className="mb-12"
      />

      <div className="mx-auto max-w-xl">
        <SurfacePanel rounded="3xl" className="p-8 md:p-10">
          <form className="space-y-6 text-stone-800 dark:text-stone-200">
            <FormField
              htmlFor="email"
              label={getTranslation(language, "forgot.email")}
            >
              <input
                id="email"
                className="input-base"
                name="email"
                type="email"
                placeholder={getTranslation(
                  language,
                  "forgot.emailPlaceholder",
                )}
                required
              />
            </FormField>

            <div className="space-y-3 pt-2">
              <button formAction={resetPassword} className="btn-primary w-full">
                {getTranslation(language, "forgot.sendLink")}
              </button>
              <Link
                href="/login"
                className="block text-center text-sm font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                {getTranslation(language, "forgot.backToSignIn")}
              </Link>
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
