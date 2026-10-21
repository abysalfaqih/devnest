import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { limits } from "../../../config/limits";
import { lit } from "./shared";

/** Catatan aksi admin. Hanya bisa ditambah; aplikasi tidak bisa mengubah atau menghapus. */
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** ID pengguna dari Supabase Auth. Tanpa foreign key agar log bertahan walau akun dihapus. */
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("admin_audit_logs_created_idx").on(t.createdAt.desc()),
    check(
      "admin_audit_logs_action_len",
      sql`char_length(${t.action}) between 1 and ${lit(limits.audit.action)}`,
    ),
    check(
      "admin_audit_logs_entity_type_len",
      sql`char_length(${t.entityType}) between 1 and ${lit(limits.audit.entityType)}`,
    ),
    check(
      "admin_audit_logs_meta_size",
      sql`pg_column_size(${t.meta}) <= ${lit(limits.audit.metaBytes)}`,
    ),
  ],
);

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
