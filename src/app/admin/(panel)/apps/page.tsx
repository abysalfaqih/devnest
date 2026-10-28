import type { Metadata } from "next";
import Link from "next/link";
import { rowActionClass } from "@/components/admin/row-action";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { AppIcon } from "@/features/apps/components/app-icon";
import { listAdminApps } from "@/server/apps/queries";
import { requireAdmin } from "@/server/auth/session";
import { DeleteButton } from "./delete-button";
import { StatusToggle } from "./status-toggle";

export const metadata: Metadata = { title: "Aplikasi" };

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function AdminAppsPage() {
  await requireAdmin();
  const items = await listAdminApps();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Aplikasi</h1>
        <ButtonLink href="/admin/apps/new">Tambah aplikasi</ButtonLink>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-muted">
          Belum ada aplikasi. Mulai dengan menambahkan yang pertama.
        </p>
      ) : (
        <ul className="mt-8 border-b border-line">
          {items.map((app) => (
            <li
              key={app.id}
              className="flex flex-col gap-4 border-t border-line py-5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <AppIcon name={app.name} iconUrl={app.iconUrl} className="size-14 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                      href={`/admin/apps/${app.id}`}
                      className="truncate font-display text-lg font-semibold tracking-tight hover:underline"
                    >
                      {app.name}
                    </Link>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    <span className="font-mono">/apps/{app.slug}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted tabular-nums">
                    Versi {app.version}. {app.linkCount} tombol unduh. Diubah{" "}
                    {dateFormat.format(app.updatedAt)}.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-2">
                <Link href={`/admin/apps/${app.id}`} className={rowActionClass}>
                  Ubah
                </Link>
                <StatusToggle id={app.id} status={app.status} />
                <DeleteButton id={app.id} name={app.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
