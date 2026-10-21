import "./load-env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";
import { seedApps, seedBanners, seedDescription } from "./seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;

async function main() {
  const url = process.env.DATABASE_URL_MIGRATE;
  if (!url) throw new Error("DATABASE_URL_MIGRATE belum diisi di .env.local");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed tidak boleh dijalankan di production.");
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    console.log(`Database: ${new URL(url).host}`);

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.apps);
    if (total > 0) {
      console.log(
        `Tabel apps sudah berisi ${total} baris. Seed dibatalkan (tidak ada yang diubah).`,
      );
      return;
    }

    await db.transaction(async (tx) => {
      const now = Date.now();

      const insertedApps = await tx
        .insert(schema.apps)
        .values(
          seedApps.map((app, index) => ({
            slug: app.slug,
            name: app.name,
            summary: app.summary,
            description: seedDescription,
            version: app.version,
            size: app.size,
            status: app.status,
            // Selang 1 hari per aplikasi supaya urutan "terbaru" jelas.
            publishedAt: app.status === "published" ? new Date(now - index * DAY_MS) : null,
          })),
        )
        .returning({ id: schema.apps.id, slug: schema.apps.slug });

      const idBySlug = new Map(insertedApps.map((row) => [row.slug, row.id]));

      await tx.insert(schema.appDownloadLinks).values(
        seedApps.flatMap((app) =>
          app.links.map((link, position) => ({
            appId: idBySlug.get(app.slug)!,
            position,
            label: link.label,
            url: link.url,
          })),
        ),
      );

      // Setiap aplikasi terbit merekomendasikan 3 aplikasi terbit lain secara bergilir.
      const published = seedApps.filter((app) => app.status === "published");
      await tx.insert(schema.appRecommendations).values(
        published.flatMap((app, index) =>
          [1, 2, 3].map((offset, position) => ({
            appId: idBySlug.get(app.slug)!,
            recommendedAppId: idBySlug.get(published[(index + offset) % published.length].slug)!,
            position,
          })),
        ),
      );

      await tx
        .insert(schema.adBanners)
        .values(seedBanners.map((banner, index) => ({ ...banner, sortOrder: index })));
    });

    console.log(
      `Seed selesai: ${seedApps.length} aplikasi, ${seedBanners.length} banner, rekomendasi dan tombol unduh.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
