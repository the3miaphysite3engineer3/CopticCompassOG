"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { loadBrowserUser } from "@/lib/supabase/clientAuth";

import type { User } from "@supabase/supabase-js";

type NavbarAuthLinkProps = {
  dashboardHref: string;
  dashboardLabel: string;
  loginHref: string;
  loginLabel: string;
  onNavigate?: () => void;
  pathname: string;
  variant: "desktop" | "mobile";
};

function getLinkClasses(
  variant: NavbarAuthLinkProps["variant"],
  isActive: boolean,
) {
  if (variant === "mobile") {
    return {
      linkClassName: `group grid justify-items-center rounded-lg px-4 py-3 text-center text-sm tracking-[0.02em] transition-colors before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-semibold before:content-[attr(data-label)] ${
        isActive
          ? "bg-accent-soft text-accent-strong dark:bg-accent-soft/35 dark:text-accent"
          : "text-muted hover:bg-elevated hover:text-ink"
      }`,
      labelClassName: `col-start-1 row-start-1 ${isActive ? "font-semibold" : "font-medium group-hover:font-semibold"}`,
    };
  }

  return {
    linkClassName: `group inline-grid h-10 items-center justify-items-center rounded-lg px-4 text-center text-sm tracking-[0.02em] transition-all duration-200 before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-semibold before:content-[attr(data-label)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
      isActive
        ? "bg-accent-soft text-accent-strong dark:bg-accent-soft/35 dark:text-accent"
        : "text-muted hover:bg-elevated hover:text-ink"
    }`,
    labelClassName: `col-start-1 row-start-1 ${isActive ? "font-semibold" : "font-medium group-hover:font-semibold"}`,
  };
}

export function NavbarAuthLink({
  dashboardHref,
  dashboardLabel,
  loginHref,
  loginLabel,
  onNavigate,
  pathname,
  variant,
}: NavbarAuthLinkProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    void loadBrowserUser(supabase)
      .then((nextUser) => {
        if (isMounted) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const href = user ? dashboardHref : loginHref;
  const label = user ? dashboardLabel : loginLabel;
  const hrefPathname = href.split("?")[0] ?? href;
  const isActive =
    pathname === hrefPathname || pathname.startsWith(`${hrefPathname}/`);
  const { linkClassName, labelClassName } = getLinkClasses(variant, isActive);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-label={label}
      className={linkClassName}
    >
      <span className={labelClassName}>{label}</span>
    </Link>
  );
}
