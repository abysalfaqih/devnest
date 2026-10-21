import { sql } from "drizzle-orm";
import { check, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { limits } from "../../../config/limits";
import { legalSlug, lit, timestamps } from "./shared";

/**
 * Halaman legal: terms, privacy, disclaimer. Barisnya dibuat oleh migrasi,
 * aplikasi hanya boleh membaca dan mengubah isinya.
 */
export const legalPages = pgTable(
  "legal_pages",
  {
    slug: legalSlug("slug").primaryKey(),
    title: text("title").notNull(),
    /** Markdown. Wajib dibersihkan saat ditampilkan. */
    contentMd: text("content_md").notNull().default(""),
    updatedBy: uuid("updated_by"),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    check(
      "legal_pages_title_len",
      sql`char_length(${t.title}) between 1 and ${lit(limits.legal.title)}`,
    ),
    check(
      "legal_pages_content_len",
      sql`char_length(${t.contentMd}) <= ${lit(limits.legal.content)}`,
    ),
  ],
);

export type LegalPage = typeof legalPages.$inferSelect;
