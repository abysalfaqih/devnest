import "./load-env";
import postgres from "postgres";

/**
 * Menjadikan akun Supabase Auth sebagai admin Devnest.
 * Pemakaian: pnpm admin:add email@anda.com
 * Akun harus dibuat lebih dulu di Supabase (Authentication, lalu Users, lalu Add user).
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Pemakaian: pnpm admin:add email@anda.com");
  }

  const url = process.env.DATABASE_URL_MIGRATE;
  if (!url) throw new Error("DATABASE_URL_MIGRATE belum diisi di .env.local");

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const users = await sql<{ id: string; email: string; email_confirmed_at: Date | null }[]>`
      select id, email, email_confirmed_at from auth.users where lower(email) = ${email}`;

    if (users.length === 0) {
      throw new Error(
        `Tidak ada akun dengan email ${email} di Supabase Auth. ` +
          `Buat dulu: Authentication, lalu Users, lalu Add user (centang Auto Confirm User).`,
      );
    }

    const user = users[0];
    if (!user.email_confirmed_at) {
      throw new Error(
        "Email akun ini belum terkonfirmasi. Di Supabase, buka Authentication, lalu Users, " +
          "dan konfirmasi akunnya (atau buat ulang dengan Auto Confirm User).",
      );
    }

    const inserted = await sql`
      insert into public.admins (user_id, email) values (${user.id}, ${email})
      on conflict (user_id) do nothing
      returning user_id`;

    console.log(
      inserted.length > 0
        ? `Admin ditambahkan: ${email}`
        : `${email} sudah terdaftar sebagai admin (tidak ada yang diubah).`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
