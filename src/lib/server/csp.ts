import { headers } from "next/headers";

export const CSP_NONCE_HEADER = "x-nonce";

/**
 * Reads the CSP nonce injected into the current request so server-rendered
 * pages can pass it through to inline script consumers when needed.
 */
export async function getCspNonce() {
  return (await headers()).get(CSP_NONCE_HEADER) ?? undefined;
}
