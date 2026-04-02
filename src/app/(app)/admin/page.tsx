import type { Metadata } from "next";
import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Instructor Workspace",
  description:
    "Private instructor workspace for reviewing grammar submissions.",
});

export default async function AdminPage() {
  return <AdminDashboardPage redirectTo="/admin" />;
}
