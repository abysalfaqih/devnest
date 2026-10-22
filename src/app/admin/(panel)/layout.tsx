import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth/session";

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

/**
 * Pintu masuk panel. Layout tidak dijalankan ulang saat berpindah halaman,
 * jadi setiap halaman di bawahnya TETAP memanggil requireAdmin() sendiri.
 */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
