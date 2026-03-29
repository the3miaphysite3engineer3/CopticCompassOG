import type { ReactNode } from "react";
import { connection } from "next/server";
import "@/app/globals.css";
import { antinoou } from "@/lib/fonts";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Nonce-based CSP depends on a live request so Next can attach the nonce to
  // framework scripts instead of falling back to unsafe-inline.
  await connection();

  return (
    <html suppressHydrationWarning>
      <body className={antinoou.variable}>{children}</body>
    </html>
  );
}
