import { revalidatePath } from "next/cache";
import {
  PUBLIC_LOCALES,
  getDashboardPath,
  getLocalizedPath,
} from "@/lib/locale";

export function getDashboardPathsToRevalidate() {
  return [
    "/dashboard",
    ...PUBLIC_LOCALES.map((locale) => getDashboardPath(locale)),
  ];
}

export function getAdminPathsToRevalidate() {
  return [
    "/admin",
    ...PUBLIC_LOCALES.map((locale) => getLocalizedPath(locale, "/admin")),
  ];
}

export function revalidatePaths(paths: readonly string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export function revalidateDashboardPaths() {
  revalidatePaths(getDashboardPathsToRevalidate());
}

export function revalidateAdminPaths() {
  revalidatePaths(getAdminPathsToRevalidate());
}
