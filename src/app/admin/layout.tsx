import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Devnest" },
  robots: { index: false, follow: false },
};

/**
 * Semua halaman admin membaca cookie sesi (data dinamis), jadi wajib berada
 * di dalam Suspense. Isi sebenarnya dilindungi di setiap halaman dan aksi.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh flex-1 place-items-center text-muted" aria-busy="true">
          Memuat...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
