"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function GrammarHubPageClient() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center p-6 md:p-10">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 dark:bg-sky-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[110px] -z-10 pointer-events-none transition-colors duration-500" />

      <div className="max-w-5xl w-full space-y-12 z-10 pt-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-tr from-sky-600 to-stone-500 dark:from-sky-400 dark:to-stone-400 bg-clip-text text-transparent drop-shadow-sm mb-4">
            {t("grammar.title")}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 dark:text-stone-400 font-medium max-w-2xl mx-auto">
            {t("grammar.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          <Link href="/grammar/lesson-1" className="group relative rounded-3xl bg-white/70 dark:bg-stone-900/50 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-8 md:p-9 shadow-md dark:shadow-xl dark:shadow-black/20 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer transform hover:-translate-y-1 min-h-[20rem]">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-xl">
                  <BookOpenText className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
                  {t("grammar.lessonBadge")}
                </span>
              </div>

              <div className="mb-4 inline-flex items-center rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-stone-600 dark:text-stone-300">
                01
              </div>
              <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mb-3">
                {t("grammar.lesson1.title")}
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-7">
                {t("grammar.lesson1.desc")}
              </p>
            </div>

            <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
              {t("grammar.openLesson")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="group relative rounded-3xl bg-stone-50/60 dark:bg-stone-900/30 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-8 md:p-9 shadow-md dark:shadow-black/20 transition-all duration-300 flex flex-col justify-between overflow-hidden opacity-90 cursor-not-allowed min-h-[20rem]">
            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-500 dark:text-stone-400">
                  <Clock3 className="h-5 w-5" />
                </div>
                <span className="px-3 py-1 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                  {t("home.comingSoon")}
                </span>
              </div>

              <div className="mb-4 inline-flex items-center rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-stone-600 dark:text-stone-300">
                  02
              </div>
              <h2 className="text-2xl font-semibold text-stone-500 dark:text-stone-400 mb-3">
                {t("grammar.lesson2.title")}
              </h2>
              <p className="text-stone-400 dark:text-stone-500 text-sm leading-7">
                {t("grammar.lesson2.desc")}
              </p>
            </div>

            <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 dark:text-stone-500">
              {t("grammar.inPreparation")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
