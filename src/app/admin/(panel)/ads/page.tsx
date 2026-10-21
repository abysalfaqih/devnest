import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Iklan" };

export default async function AdminAdsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Iklan" phase="Fase 7" />;
}
