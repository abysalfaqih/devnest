import "server-only";
import { db } from "./db";
import { adminAuditLogs } from "./db/schema";

type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
};

/** Koneksi biasa atau transaksi, supaya catatan audit ikut batal jika transaksinya batal. */
type AuditExecutor = Pick<typeof db, "insert">;

/** Mencatat aksi admin. Tabelnya hanya bisa ditambah, tidak bisa diubah atau dihapus. */
export async function recordAudit(entry: AuditEntry, executor: AuditExecutor = db) {
  await executor.insert(adminAuditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    meta: entry.meta ?? {},
  });
}
