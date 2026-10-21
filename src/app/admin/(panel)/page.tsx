import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { adBanners, apps } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const [appStats] = await db
    .select({
      published: sql<number>`count(*) filter (where ${apps.status} = 'published' and ${apps.deletedAt} is null)::int`,
      drafts: sql<number>`count(*) filter (where ${apps.status} = 'draft' and ${apps.deletedAt} is null)::int`,
    })
    .from(apps);

  const [bannerStats] = await db
    .select({ active: sql<number>`count(*) filter (where ${adBanners.isActive})::int` })
    .from(adBanners);

  const stats = [
    { label: "Aplikasi terbit", value: appStats.published },
    { label: "Aplikasi draf", value: appStats.drafts },
    { label: "Banner aktif", value: bannerStats.active },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-muted">Masuk sebagai {admin.email}</p>

      <dl className="mt-10 grid gap-x-10 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border-t border-line py-4">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 font-display text-5xl font-bold tracking-tight tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 max-w-prose text-muted">
        Statistik pengunjung dan unduhan realtime hadir di Fase 8.
      </p>
    </>
  );
}
