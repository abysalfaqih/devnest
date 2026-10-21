import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { limits } from "../../../config/limits";
import { adTone, httpsUrlRegex, internalPathRegex, lit, timestamps } from "./shared";

/** Banner iklan di bagian atas beranda. Dikelola dari halaman admin. */
export const adBanners = pgTable(
  "ad_banners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    /** Gambar rasio 2:1. Jika kosong, tampil panel teks. */
    imageUrl: text("image_url"),
    imagePublicId: text("image_public_id"),
    imageAlt: text("image_alt").notNull().default(""),
    /** Tujuan klik: URL https atau alamat internal seperti "/apps". */
    targetUrl: text("target_url").notNull(),
    tone: adTone("tone").notNull().default("moss"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("ad_banners_active_order_idx").on(t.isActive, t.sortOrder),
    check(
      "ad_banners_title_len",
      sql`char_length(${t.title}) between 1 and ${lit(limits.banner.title)}`,
    ),
    check(
      "ad_banners_subtitle_len",
      sql`${t.subtitle} is null or char_length(${t.subtitle}) <= ${lit(limits.banner.subtitle)}`,
    ),
    check(
      "ad_banners_image_alt_len",
      sql`char_length(${t.imageAlt}) <= ${lit(limits.banner.imageAlt)}`,
    ),
    check(
      "ad_banners_target_valid",
      sql`char_length(${t.targetUrl}) <= ${lit(limits.banner.url)} and (${t.targetUrl} ~ ${httpsUrlRegex} or ${t.targetUrl} ~ ${internalPathRegex})`,
    ),
  ],
);

export type AdBannerRow = typeof adBanners.$inferSelect;
export type NewAdBanner = typeof adBanners.$inferInsert;
