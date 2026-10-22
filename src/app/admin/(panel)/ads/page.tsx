import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Iklan" };

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

export default async function AdminAdsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Iklan" phase="Fase 7" />;
}
