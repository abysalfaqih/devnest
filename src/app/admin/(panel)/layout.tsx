import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth/session";

/**
 * Pintu masuk panel. Layout tidak dijalankan ulang saat berpindah halaman,
 * jadi setiap halaman di bawahnya TETAP memanggil requireAdmin() sendiri.
 */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
