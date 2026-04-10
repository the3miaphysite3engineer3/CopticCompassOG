import { stripLocaleFromPathname } from "@/lib/locale";

const AUTH_SESSION_ROUTE_PREFIXES = ["/admin", "/dashboard"] as const;

/**
 * Returns whether the pathname should pass through the auth-session refresh
 * proxy before the request reaches the page or route handler.
 */
export function requiresAuthSessionProxy(pathname: string) {
  const normalizedPathname = stripLocaleFromPathname(pathname);

  if (normalizedPathname === "/update-password") {
    return true;
  }

  return AUTH_SESSION_ROUTE_PREFIXES.some(
    (routePrefix) =>
      normalizedPathname === routePrefix ||
      normalizedPathname.startsWith(`${routePrefix}/`),
  );
}
