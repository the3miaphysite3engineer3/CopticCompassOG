"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "./LanguageProvider";
import type { User } from "@supabase/supabase-js";

export function Navbar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: "/publications", label: t("nav.publications") },
    { href: "/dictionary", label: t("nav.dictionary") },
    { href: "/grammar", label: t("nav.grammar") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const authLink = user
    ? { href: "/dashboard", label: t("nav.dashboard") }
    : { href: "/login", label: t("nav.login") || "Log In" };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/70 backdrop-blur-md shadow-sm transition-colors duration-300 dark:border-stone-800 dark:bg-stone-950/70">
      <div className="site-container">
        <div className="flex min-h-[4.75rem] items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25"
          >
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src="/logo/logo-colored.svg"
                alt="Wannes Logo"
                fill
                className="object-contain drop-shadow"
                priority
              />
            </div>
            <span className="truncate font-coptic text-xl font-bold text-transparent bg-gradient-to-r from-stone-800 to-stone-500 bg-clip-text transition-colors dark:from-stone-100 dark:to-stone-400">
              {t("nav.home")}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[...links, authLink].map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-label={link.label}
                  className={`group inline-grid h-10 items-center rounded-full px-4 text-sm tracking-[0.02em] transition-all duration-200 before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-semibold before:content-[attr(data-label)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25 ${
                    isActive
                      ? "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
                  }`}
                >
                  <span className={`col-start-1 row-start-1 ${isActive ? "font-semibold" : "font-medium group-hover:font-semibold"}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button
              className="icon-button md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="mb-3 flex flex-col gap-1 rounded-2xl border border-stone-200 bg-white/80 p-2 shadow-md backdrop-blur-md md:hidden dark:border-stone-800 dark:bg-stone-900/70 dark:shadow-black/20">
            {[...links, authLink].map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-label={link.label}
                  className={`group grid rounded-xl px-4 py-3 text-sm tracking-[0.02em] transition-colors before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-semibold before:content-[attr(data-label)] ${
                    isActive
                      ? "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900/60 dark:hover:text-stone-200"
                  }`}
                >
                  <span className={`col-start-1 row-start-1 ${isActive ? "font-semibold" : "font-medium group-hover:font-semibold"}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
