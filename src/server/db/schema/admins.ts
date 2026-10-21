import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Daftar admin. user_id adalah ID pengguna di Supabase Auth. Hanya akun yang
 * ada di tabel ini yang boleh masuk panel admin, walau akun lain berhasil login.
 * Baris ditambah lewat `pnpm admin:add` (hak pemilik); aplikasi hanya bisa membaca.
 */
export const admins = pgTable(
  "admins",
  {
    userId: uuid("user_id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("admins_email_len", sql`char_length(${t.email}) between 3 and 254`)],
);

export type Admin = typeof admins.$inferSelect;
