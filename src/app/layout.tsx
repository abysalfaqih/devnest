import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: "Devnest", template: "%s | Devnest" },
  description: "Tempat saya membagikan aplikasi buatan sendiri.",
  // SEMENTARA: hapus baris ini di Fase 9 (SEO) saat situs siap diindeks.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
