import "./load-env";
import postgres from "postgres";

/**
 * Memeriksa konfigurasi database dan keamanannya.
 * - DATABASE_URL_MIGRATE (pemilik): membaca katalog database.
 * - DATABASE_URL (devnest_app): menguji apa yang boleh dan tidak boleh dilakukan aplikasi.
 */

const TABLES = [
  "admins",
  "apps",
  "app_download_links",
  "app_screenshots",
  "app_recommendations",
  "ad_banners",
  "legal_pages",
  "download_sessions",
  "admin_audit_logs",
] as const;

const PRIVILEGES = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];

let failures = 0;
function pass(message: string) {
  console.log(`  ✓ ${message}`);
}
function fail(message: string) {
  failures += 1;
  console.log(`  ✗ ${message}`);
}
function check(ok: boolean, message: string) {
  if (ok) pass(message);
  else fail(message);
}

function hostOf(url: string) {
  return new URL(url).host;
}

async function checkOwner(url: string) {
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    console.log(`\nPemilik (${hostOf(url)})`);

    const tables = await sql<{ relname: string; relrowsecurity: boolean }[]>`
      select c.relname, c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`;
    const found = new Map(tables.map((t) => [t.relname, t.relrowsecurity]));

    for (const table of TABLES) {
      check(found.has(table), `tabel ${table} ada`);
    }
    const extra = tables
      .map((t) => t.relname)
      .filter((n) => !(TABLES as readonly string[]).includes(n));
    for (const name of extra) {
      fail(
        `tabel ${name} tidak ada di daftar pemeriksaan (tambahkan ke scripts/db-check.ts dan pastikan aturan keamanannya)`,
      );
    }

    for (const [name, rls] of found) check(rls, `RLS aktif di ${name}`);

    const policies = await sql<{ tablename: string }[]>`
      select tablename from pg_policies
      where schemaname = 'public' and 'devnest_app' = any(roles)`;
    const withPolicy = new Set(policies.map((p) => p.tablename));
    for (const table of TABLES) check(withPolicy.has(table), `policy devnest_app ada di ${table}`);

    const roles = await sql<{ rolname: string }[]>`
      select rolname from pg_roles where rolname in ('anon', 'authenticated')`;
    for (const { rolname } of roles) {
      let leaked = 0;
      for (const table of TABLES) {
        for (const privilege of PRIVILEGES) {
          const [row] = await sql<{ ok: boolean }[]>`
            select has_table_privilege(${rolname}, ${"public." + table}, ${privilege}) as ok`;
          if (row.ok) leaked += 1;
        }
      }
      check(leaked === 0, `${rolname} tidak punya akses apa pun ke tabel (Data API tertutup)`);
    }

    const [app] = await sql<
      {
        rolcanlogin: boolean;
        rolsuper: boolean;
        rolbypassrls: boolean;
        rolcreaterole: boolean;
        rolcreatedb: boolean;
      }[]
    >`select rolcanlogin, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb from pg_roles where rolname = 'devnest_app'`;
    check(Boolean(app), "role devnest_app ada");
    if (app) {
      check(app.rolcanlogin, "devnest_app bisa login (password sudah diatur)");
      check(
        !app.rolsuper && !app.rolbypassrls && !app.rolcreaterole && !app.rolcreatedb,
        "devnest_app bukan superuser, tanpa bypass RLS, tanpa hak membuat role/database",
      );
      const [schema] = await sql<{ ok: boolean }[]>`
        select has_schema_privilege('devnest_app', 'public', 'CREATE') as ok`;
      check(
        !schema.ok,
        "devnest_app tidak bisa membuat objek di schema public" +
          (schema.ok ? " (jalankan: REVOKE CREATE ON SCHEMA public FROM PUBLIC;)" : ""),
      );
    }

    // Skema auth milik Supabase Auth: role aplikasi tidak boleh menyentuhnya.
    const [authSchema] = await sql<
      { ok: boolean }[]
    >`select to_regclass('auth.users') is not null as ok`;
    if (authSchema.ok) {
      const [access] = await sql<{ usage: boolean; users: boolean }[]>`
        select has_schema_privilege('devnest_app', 'auth', 'USAGE') as usage,
               has_table_privilege('devnest_app', 'auth.users', 'SELECT') as users`;
      check(
        !access.usage && !access.users,
        "devnest_app tidak bisa mengakses skema auth (data akun Supabase Auth)",
      );
    }

    const [{ total }] = await sql<{ total: number }[]>`
      select count(*)::int as total from drizzle.__drizzle_migrations`;
    check(total >= 4, `migrasi tercatat: ${total}`);

    console.log("\nJumlah baris");
    for (const table of TABLES) {
      const [row] = await sql.unsafe<{ total: number }[]>(
        `select count(*)::int as total from public.${table}`,
      );
      console.log(`  ${table.padEnd(22)} ${row.total}`);
    }
  } finally {
    await sql.end();
  }
}

/** Sinyal internal: pernyataan ternyata berhasil, jadi transaksi harus dibatalkan. */
class RolledBack extends Error {}

/**
 * Menjalankan pernyataan yang SEHARUSNYA ditolak. Selalu di dalam transaksi
 * yang dibatalkan, jadi seandainya berhasil pun tidak ada yang berubah.
 */
async function expectDenied(sql: postgres.Sql, label: string, statement: string) {
  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(statement);
      throw new RolledBack();
    });
  } catch (error) {
    if (error instanceof RolledBack) {
      fail(
        `${label}: seharusnya DITOLAK tetapi berhasil (sudah dibatalkan, tidak ada yang berubah)`,
      );
      return;
    }
    const code = (error as { code?: string }).code;
    if (code === "42501") pass(`${label}: ditolak (permission denied)`);
    else fail(`${label}: ditolak, tetapi bukan karena izin [kode ${code}]`);
  }
}

async function checkApp(url: string) {
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    console.log(`\nAplikasi (${hostOf(url)})`);

    const [who] = await sql<{ current_user: string }[]>`select current_user`;
    if (who.current_user !== "devnest_app") {
      fail(
        `login sebagai ${who.current_user}, seharusnya devnest_app. ` +
          `Periksa DATABASE_URL di .env.local: bagian user harus "devnest_app.PROJECT_REF" ` +
          `dan password harus milik devnest_app. Pengujian izin dihentikan.`,
      );
      return;
    }
    pass("login sebagai devnest_app");

    const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from apps`;
    pass(`bisa membaca apps (${total} baris)`);
    const [{ admins }] = await sql<
      { admins: number }[]
    >`select count(*)::int as admins from admins`;
    pass(`bisa membaca admins (${admins} baris)`);

    await expectDenied(sql, "DELETE apps", "delete from apps");
    await expectDenied(sql, "TRUNCATE apps", "truncate apps cascade");
    await expectDenied(
      sql,
      "UPDATE admin_audit_logs",
      "update admin_audit_logs set action = action",
    );
    await expectDenied(sql, "DELETE admin_audit_logs", "delete from admin_audit_logs");
    await expectDenied(
      sql,
      "INSERT legal_pages",
      "insert into legal_pages (slug, title) values ('terms', 'x')",
    );
    await expectDenied(
      sql,
      "INSERT admins",
      "insert into admins (user_id, email) values (gen_random_uuid(), 'x@x.x')",
    );
    await expectDenied(sql, "UPDATE admins", "update admins set email = email");
    await expectDenied(sql, "DELETE admins", "delete from admins");
    await expectDenied(sql, "CREATE TABLE", "create table _db_check_probe (i int)");
  } finally {
    await sql.end();
  }
}

async function main() {
  const ownerUrl = process.env.DATABASE_URL_MIGRATE;
  const appUrl = process.env.DATABASE_URL;

  if (ownerUrl) await checkOwner(ownerUrl);
  else fail("DATABASE_URL_MIGRATE belum diisi di .env.local");

  if (appUrl) await checkApp(appUrl);
  else fail("DATABASE_URL belum diisi di .env.local");

  console.log(failures === 0 ? "\nSemua pemeriksaan lulus." : `\n${failures} pemeriksaan GAGAL.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
