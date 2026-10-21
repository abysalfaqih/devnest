import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { limits } from "../../../config/limits";
import { appStatus, httpsUrlRegex, lit, timestamps } from "./shared";

export const apps = pgTable(
  "apps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Dibuat otomatis dari nama saat aplikasi dibuat. Tidak bisa diubah dan tidak dipakai ulang. */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    /** Markdown. Wajib dibersihkan saat ditampilkan. */
    description: text("description").notNull().default(""),
    version: text("version").notNull(),
    size: text("size").notNull(),
    /** SHA-256 file unduhan (opsional), huruf kecil heksadesimal. */
    checksumSha256: text("checksum_sha256"),
    iconUrl: text("icon_url"),
    iconPublicId: text("icon_public_id"),
    status: appStatus("status").notNull().default("draft"),
    /** Diisi trigger saat pertama kali dipublikasikan. */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Hapus lunak. Baris tidak pernah dihapus oleh aplikasi. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("apps_slug_key").on(t.slug),
    index("apps_published_idx")
      .on(t.publishedAt.desc())
      .where(sql`${t.status} = 'published' and ${t.deletedAt} is null`),
    check(
      "apps_slug_format",
      sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${t.slug}) <= 80`,
    ),
    check("apps_name_len", sql`char_length(${t.name}) between 1 and ${lit(limits.app.name)}`),
    check(
      "apps_summary_len",
      sql`char_length(${t.summary}) between 1 and ${lit(limits.app.summary)}`,
    ),
    check(
      "apps_description_len",
      sql`char_length(${t.description}) <= ${lit(limits.app.description)}`,
    ),
    check(
      "apps_version_len",
      sql`char_length(${t.version}) between 1 and ${lit(limits.app.version)}`,
    ),
    check("apps_size_len", sql`char_length(${t.size}) between 1 and ${lit(limits.app.size)}`),
    check(
      "apps_checksum_format",
      sql`${t.checksumSha256} is null or ${t.checksumSha256} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "apps_published_has_date",
      sql`${t.status} <> 'published' or ${t.publishedAt} is not null`,
    ),
  ],
);

/**
 * Tombol unduh (maksimal 3 per aplikasi). Dipisah dari tabel apps agar
 * link asli tidak ikut terbawa saat data aplikasi dibaca untuk tampilan publik.
 */
export const appDownloadLinks = pgTable(
  "app_download_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    ...timestamps,
  },
  (t) => [
    unique("app_download_links_app_position_key").on(t.appId, t.position),
    unique("app_download_links_id_app_key").on(t.id, t.appId),
    check(
      "app_download_links_position_range",
      sql`${t.position} between 0 and ${lit(limits.app.downloadLinks - 1)}`,
    ),
    check(
      "app_download_links_label_len",
      sql`char_length(${t.label}) between 1 and ${lit(limits.downloadLink.label)}`,
    ),
    check(
      "app_download_links_url_valid",
      sql`char_length(${t.url}) <= ${lit(limits.downloadLink.url)} and ${t.url} ~ ${httpsUrlRegex}`,
    ),
  ],
);

export const appScreenshots = pgTable(
  "app_screenshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    url: text("url").notNull(),
    publicId: text("public_id").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    unique("app_screenshots_app_position_key").on(t.appId, t.position),
    check(
      "app_screenshots_position_range",
      sql`${t.position} between 0 and ${lit(limits.app.screenshots - 1)}`,
    ),
    check("app_screenshots_size_positive", sql`${t.width} > 0 and ${t.height} > 0`),
  ],
);

/** Rekomendasi pilihan admin (maksimal 3 per aplikasi). */
export const appRecommendations = pgTable(
  "app_recommendations",
  {
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    recommendedAppId: uuid("recommended_app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
  },
  (t) => [
    primaryKey({ name: "app_recommendations_pkey", columns: [t.appId, t.position] }),
    unique("app_recommendations_app_target_key").on(t.appId, t.recommendedAppId),
    check(
      "app_recommendations_position_range",
      sql`${t.position} between 0 and ${lit(limits.app.recommendations - 1)}`,
    ),
    check("app_recommendations_not_self", sql`${t.appId} <> ${t.recommendedAppId}`),
  ],
);

export const appsRelations = relations(apps, ({ many }) => ({
  downloadLinks: many(appDownloadLinks),
  screenshots: many(appScreenshots),
  recommendations: many(appRecommendations, { relationName: "app_recommendations" }),
  recommendedBy: many(appRecommendations, { relationName: "recommended_by" }),
}));

export const appDownloadLinksRelations = relations(appDownloadLinks, ({ one }) => ({
  app: one(apps, { fields: [appDownloadLinks.appId], references: [apps.id] }),
}));

export const appScreenshotsRelations = relations(appScreenshots, ({ one }) => ({
  app: one(apps, { fields: [appScreenshots.appId], references: [apps.id] }),
}));

export const appRecommendationsRelations = relations(appRecommendations, ({ one }) => ({
  app: one(apps, {
    fields: [appRecommendations.appId],
    references: [apps.id],
    relationName: "app_recommendations",
  }),
  recommendedApp: one(apps, {
    fields: [appRecommendations.recommendedAppId],
    references: [apps.id],
    relationName: "recommended_by",
  }),
}));

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type AppDownloadLink = typeof appDownloadLinks.$inferSelect;
export type AppScreenshot = typeof appScreenshots.$inferSelect;
export type AppRecommendation = typeof appRecommendations.$inferSelect;
