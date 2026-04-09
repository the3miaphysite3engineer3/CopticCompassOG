import { revalidatePath } from "next/cache";

import {
  PUBLIC_LOCALES,
  getDashboardPath,
  getLocalizedPath,
} from "@/lib/locale";

/**
 * Returns every dashboard route variant that should be invalidated after a
 * learner-facing change.
 */
export function getDashboardPathsToRevalidate() {
  return [
    "/dashboard",
    ...PUBLIC_LOCALES.map((locale) => getDashboardPath(locale)),
  ];
}

/**
 * Returns every admin route variant that should be invalidated after an
 * administrative change.
 */
export function getAdminPathsToRevalidate() {
  return [
    "/admin",
    ...PUBLIC_LOCALES.map((locale) => getLocalizedPath(locale, "/admin")),
  ];
}

/**
 * Revalidates each path in order so callers can invalidate several related
 * route variants with one helper.
 */
function revalidatePaths(paths: readonly string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * Revalidates the dashboard routes across the locale variants used by the app.
 */
export function revalidateDashboardPaths() {
  revalidatePaths(getDashboardPathsToRevalidate());
}

/**
 * Revalidates the admin routes across the locale variants used by the app.
 */
export function revalidateAdminPaths() {
  revalidatePaths(getAdminPathsToRevalidate());
}
