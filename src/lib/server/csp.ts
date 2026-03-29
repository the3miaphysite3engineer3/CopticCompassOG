import { headers } from "next/headers";

export const CSP_NONCE_HEADER = "x-nonce";

export async function getCspNonce() {
  return (await headers()).get(CSP_NONCE_HEADER) ?? undefined;
}
