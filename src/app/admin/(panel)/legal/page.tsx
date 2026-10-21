import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Halaman legal" };

export default async function AdminLegalPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Halaman legal" phase="Fase 7" />;
}
