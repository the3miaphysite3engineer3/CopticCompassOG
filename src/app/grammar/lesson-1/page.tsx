"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Lesson01EN } from "../components/Lesson01EN";
import { Lesson01NL } from "../components/Lesson01NL";

export default function GrammarPage() {
  const { language, t } = useLanguage();
  const lessonLabel = language === "nl" ? "Les 01" : "Lesson 01";

  return (
    <main className="min-h-screen relative overflow-hidden px-6 py-16 md:px-10">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 dark:bg-sky-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/grammar" className="btn-secondary gap-2 px-4">
            <ArrowLeft className="h-4 w-4" />
            {t("grammar.back")}
          </Link>
        </div>

        <div className="text-center mb-10 space-y-4">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
            {lessonLabel}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-tr from-sky-600 to-stone-500 dark:from-sky-400 dark:to-stone-400 bg-clip-text text-transparent drop-shadow-sm">
            {t("nav.grammar")} - {lessonLabel}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 dark:text-stone-400 font-medium max-w-3xl mx-auto">
            {t("grammar.lesson1.desc")}
          </p>
        </div>

        <div className="bg-white/75 dark:bg-stone-900/55 shadow-md dark:shadow-xl dark:shadow-black/20 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-10 backdrop-blur-md transition-colors duration-300">
          {language === "nl" ? <Lesson01NL /> : <Lesson01EN />}
        </div>
      </div>
    </main>
  );
}
