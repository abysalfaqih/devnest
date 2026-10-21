import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Aplikasi" };

export default async function AdminAppsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Aplikasi" phase="Fase 4" />;
}
