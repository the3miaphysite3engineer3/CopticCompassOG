"use client";

import { login, signup } from "@/actions/auth";
import { useLanguage } from "@/components/LanguageProvider";

const NOTICE_TRANSLATION_KEYS = {
  "auth-unavailable": "login.notice.authUnavailable",
  "login-invalid-input": "login.notice.loginInvalidInput",
  "login-error": "login.notice.loginError",
  "login-rate-limited": "login.notice.loginRateLimited",
  "signup-check-email": "login.notice.signupCheckEmail",
  "signup-confirmed": "login.notice.signupConfirmed",
  "signup-error": "login.notice.signupError",
  "signup-invalid-input": "login.notice.signupInvalidInput",
  "signup-rate-limited": "login.notice.signupRateLimited",
} as const;

type NoticeState = keyof typeof NOTICE_TRANSLATION_KEYS;
type NoticeType = "error" | "success" | "info";

export function LoginForm({
  message,
  messageType = "error",
  redirectTo,
  state,
}: {
  message?: string;
  messageType?: NoticeType;
  redirectTo?: string;
  state?: string;
}) {
  const { t } = useLanguage();
  const noticeKey =
    state && state in NOTICE_TRANSLATION_KEYS
      ? NOTICE_TRANSLATION_KEYS[state as NoticeState]
      : undefined;
  const noticeMessage = noticeKey ? t(noticeKey) : message;
  const noticeVariant = noticeKey ? "success" : messageType;
  const noticeClassName =
    noticeVariant === "success"
      ? "rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium text-center"
      : noticeVariant === "info"
        ? "rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/80 dark:bg-sky-950/20 px-4 py-3 text-sky-700 dark:text-sky-400 text-sm font-medium text-center"
        : "rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 px-4 py-3 text-red-600 dark:text-red-400 text-sm font-medium text-center";

  return (
    <div className="min-h-screen relative overflow-hidden px-6 py-16 md:px-10">
      <div className="absolute top-0 left-0 w-[420px] h-[420px] bg-sky-500/10 dark:bg-sky-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />

      <div className="max-w-3xl mx-auto pt-8">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-tr from-sky-600 to-emerald-500 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
            {t("login.title")}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 dark:text-stone-400 font-medium max-w-2xl mx-auto">
            {t("login.subtitle")}
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <form className="space-y-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/50 backdrop-blur-md p-8 md:p-10 shadow-md dark:shadow-xl dark:shadow-black/20 text-stone-800 dark:text-stone-200">
            {redirectTo && (
              <input
                type="hidden"
                name="redirectTo"
                value={redirectTo}
              />
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold block" htmlFor="email">
                {t("login.email")}
              </label>
              <input
                className="input-base"
                name="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold block" htmlFor="password">
                {t("login.password")}
              </label>
              <input
                className="input-base"
                type="password"
                name="password"
                placeholder={t("login.passwordPlaceholder")}
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <button
                formAction={login}
                className="btn-primary w-full"
              >
                {t("login.signIn")}
              </button>
              <button
                formAction={signup}
                className="btn-secondary w-full"
              >
                {t("login.createAccount")}
              </button>
            </div>

            {noticeMessage && (
              <p className={noticeClassName}>
                {noticeMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
