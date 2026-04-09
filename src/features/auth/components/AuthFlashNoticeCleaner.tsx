"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { stripLoginFlashParams } from "@/features/auth/lib/loginNotice";

export function AuthFlashNoticeCleaner() {
  const pathname = usePathname() ?? "/login";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    const hasFlashParams =
      currentParams.has("message") ||
      currentParams.has("messageType") ||
      currentParams.has("state");

    if (!hasFlashParams) {
      return;
    }

    const nextHref = stripLoginFlashParams(pathname, currentParams);
    const currentHref = `${pathname}${window.location.search}`;

    if (nextHref === currentHref) {
      return;
    }

    window.history.replaceState(window.history.state, "", nextHref);
  }, [pathname]);

  return null;
}
