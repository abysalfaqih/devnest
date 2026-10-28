import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminApp } from "@/server/apps/queries";
import { requireAdmin } from "@/server/auth/session";
import { AppForm } from "../app-form";

export const metadata: Metadata = { title: "Ubah aplikasi" };

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

export default async function EditAppPage(props: PageProps<"/admin/apps/[id]">) {
  await requireAdmin();

  const { id } = await props.params;
  const { baru } = await props.searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const app = await getAdminApp(id);
  if (!app) notFound();

  return (
    <>
      <Link href="/admin/apps" className="text-sm text-muted underline underline-offset-4">
        Semua aplikasi
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">{app.name}</h1>
        <StatusBadge status={app.status} />
      </div>
      {baru ? (
        <p role="status" className="mt-3 text-sm font-semibold text-brand">
          Aplikasi dibuat.
        </p>
      ) : null}

      <div className="mt-8">
        <AppForm
          initial={{
            id: app.id,
            slug: app.slug,
            name: app.name,
            summary: app.summary,
            description: app.description,
            version: app.version,
            size: app.size,
            checksum: app.checksumSha256 ?? "",
            status: app.status,
            icon:
              app.iconPublicId && app.iconUrl
                ? { publicId: app.iconPublicId, previewUrl: app.iconUrl }
                : null,
            links: app.downloadLinks.map((link) => ({
              key: link.id,
              label: link.label,
              url: link.url,
            })),
          }}
        />
      </div>
    </>
  );
}
