import { sql } from "drizzle-orm";
import { pgEnum, timestamp } from "drizzle-orm/pg-core";

export const APP_STATUSES = ["draft", "published"] as const;
export const AD_TONES = ["moss", "marigold", "ink"] as const;
export const LEGAL_SLUGS = ["terms", "privacy", "disclaimer"] as const;

export const appStatus = pgEnum("app_status", APP_STATUSES);
export const adTone = pgEnum("ad_tone", AD_TONES);
export const legalSlug = pgEnum("legal_slug", LEGAL_SLUGS);

/** created_at diisi otomatis. updated_at diperbarui oleh trigger database. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Menyisipkan angka ke SQL. Constraint tidak boleh memakai parameter. */
export const lit = (value: number) => sql.raw(String(value));

/** URL https tanpa spasi dan tanpa "user@" di bagian host. */
export const httpsUrlRegex = sql.raw(`'^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'`);

/** Alamat internal situs: "/" atau "/jalur", bukan "//host". */
export const internalPathRegex = sql.raw(`'^/([^/[:space:]][^[:space:]]*)?$'`);
