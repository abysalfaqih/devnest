import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { appDownloadLinks } from "./apps";

/**
 * Sesi verifikasi unduhan 3 langkah. Semua pengecekan waktu memakai jam
 * database (now()), bukan jam browser atau server aplikasi.
 * Token asli hanya ada di browser pengguna; database menyimpan hash-nya.
 */
export const downloadSessions = pgTable(
  "download_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** SHA-256 dari token acak, huruf kecil heksadesimal (64 karakter). */
    tokenHash: text("token_hash").notNull(),
    appId: uuid("app_id").notNull(),
    linkId: uuid("link_id").notNull(),
    /** Langkah yang sedang berjalan (1 sampai 3). */
    step: smallint("step").notNull().default(1),
    stepStartedAt: timestamp("step_started_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Hash IP dengan garam harian. IP mentah tidak pernah disimpan. */
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("download_sessions_token_hash_key").on(t.tokenHash),
    index("download_sessions_expires_idx").on(t.expiresAt),
    index("download_sessions_app_idx").on(t.appId, t.createdAt),
    // Tombol unduh yang dipilih wajib milik aplikasi yang sama.
    foreignKey({
      name: "download_sessions_link_app_fk",
      columns: [t.linkId, t.appId],
      foreignColumns: [appDownloadLinks.id, appDownloadLinks.appId],
    }).onDelete("cascade"),
    check("download_sessions_token_format", sql`${t.tokenHash} ~ '^[a-f0-9]{64}$'`),
    check("download_sessions_step_range", sql`${t.step} between 1 and 3`),
    check(
      "download_sessions_completed_at_last_step",
      sql`${t.completedAt} is null or ${t.step} = 3`,
    ),
  ],
);

export type DownloadSession = typeof downloadSessions.$inferSelect;
