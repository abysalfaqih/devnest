import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "../env";
import * as schema from "./schema";

/**
 * Satu koneksi bersama per proses. Di mode dev, Next.js memuat ulang modul
 * berulang kali, jadi klien disimpan di globalThis agar koneksi tidak menumpuk.
 */
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ??
  postgres(serverEnv.DATABASE_URL, {
    // Wajib false untuk Supabase Transaction pooler (port 6543).
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
