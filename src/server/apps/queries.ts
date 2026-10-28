import "server-only";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { appDownloadLinks, apps } from "../db/schema";

/** Daftar aplikasi untuk panel admin (tanpa yang sudah dihapus), terbaru diubah lebih dulu. */
export async function listAdminApps() {
  return db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      version: apps.version,
      status: apps.status,
      iconUrl: apps.iconUrl,
      updatedAt: apps.updatedAt,
      // Nama tabel ditulis eksplisit: Drizzle membuang awalan tabel pada query satu-tabel,
      // sehingga `${apps.id}` terbaca sebagai kolom id milik subquery itu sendiri (selalu 0).
      linkCount: sql<number>`(select count(*)::int from app_download_links as l where l.app_id = apps.id)`,
    })
    .from(apps)
    .where(isNull(apps.deletedAt))
    .orderBy(desc(apps.updatedAt));
}

/** Satu aplikasi lengkap dengan tombol unduhnya. Null jika tidak ada atau sudah dihapus. */
export async function getAdminApp(id: string) {
  const app = await db.query.apps.findFirst({
    where: and(eq(apps.id, id), isNull(apps.deletedAt)),
    with: { downloadLinks: { orderBy: [asc(appDownloadLinks.position)] } },
  });
  return app ?? null;
}
