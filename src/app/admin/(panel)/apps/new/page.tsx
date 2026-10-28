import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { AppForm } from "../app-form";

export const metadata: Metadata = { title: "Tambah aplikasi" };

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

export default async function NewAppPage() {
  await requireAdmin();

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Tambah aplikasi</h1>
      <div className="mt-8">
        <AppForm
          initial={{
            name: "",
            summary: "",
            description: "",
            version: "",
            size: "",
            checksum: "",
            status: "draft",
            icon: null,
            links: [{ key: "baru-0", label: "Unduh", url: "" }],
          }}
        />
      </div>
    </>
  );
}
