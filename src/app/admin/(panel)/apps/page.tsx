import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Aplikasi" };

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

export default async function AdminAppsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Aplikasi" phase="Fase 4" />;
}
