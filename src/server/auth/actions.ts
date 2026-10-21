"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { recordAudit } from "../audit";
import { getAdminState, isAdminUser } from "./session";
import { createSupabaseServerClient } from "./supabase";
import type { EnrollResult, FormState } from "./types";

const LOGIN_FAILED = "Email atau password salah.";
const CODE_FAILED = "Kode salah atau sudah kedaluwarsa. Coba lagi.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1).max(256),
});

const codeSchema = z.string().regex(/^\d{6}$/);

/** Petunjuk untuk pemilik di terminal saat pengembangan. Tidak pernah tampil di browser atau production. */
function devHint(message: string) {
  if (process.env.NODE_ENV !== "production") console.warn(`[admin login] ${message}`);
}

/** Login dengan email dan password. Semua kegagalan memakai pesan yang sama. */
export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: LOGIN_FAILED };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error?.status === 429) {
    return { error: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi." };
  }
  if (error || !data.user) {
    devHint(`Supabase menolak login (${error?.code ?? error?.message ?? "tanpa pesan"}).`);
    return { error: LOGIN_FAILED };
  }

  // Akun yang berhasil login tetapi bukan admin: keluarkan dan beri pesan yang sama.
  if (!(await isAdminUser(data.user.id))) {
    devHint(
      "Password benar, tetapi akun ini belum terdaftar sebagai admin. Jalankan: pnpm admin:add email@anda.com",
    );
    await supabase.auth.signOut();
    return { error: LOGIN_FAILED };
  }

  await recordAudit({
    actorId: data.user.id,
    action: "auth.login",
    entityType: "admin",
    entityId: data.user.id,
  });

  // Login password selalu menghasilkan sesi aal1, jadi langsung ke tujuan akhirnya.
  // Mengalihkan ke /admin akan dipotong proxy dan membuat rantai redirect.
  redirect("/admin/mfa");
}

/** Mulai mendaftarkan aplikasi authenticator (TOTP). Hanya untuk admin yang belum punya MFA. */
export async function startMfaEnrollmentAction(): Promise<EnrollResult> {
  const state = await getAdminState();
  if (state.status !== "mfa-enroll") return { error: "Tidak diizinkan." };

  const supabase = await createSupabaseServerClient();

  // Bersihkan pendaftaran lama yang tidak pernah diselesaikan.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Devnest",
    friendlyName: `Devnest ${new Date().toISOString()}`,
  });
  if (error || !data) return { error: "Gagal memulai pendaftaran. Coba lagi." };

  // Gambar QR harus berupa SVG data URI; tolak yang lain.
  if (!data.totp.qr_code.startsWith("data:image/svg+xml")) {
    return { error: "Format kode QR tidak dikenali." };
  }

  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

/**
 * Memverifikasi kode 6 digit. Dipakai saat pendaftaran pertama (ada factorId
 * dari form) dan saat login berikutnya (factorId diambil dari akun, bukan dari form).
 */
export async function verifyMfaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const state = await getAdminState();
  if (state.status !== "mfa-enroll" && state.status !== "mfa-verify") {
    redirect("/admin/login");
  }

  const code = codeSchema.safeParse(formData.get("code"));
  if (!code.success) return { error: "Masukkan 6 digit angka dari aplikasi authenticator." };

  const supabase = await createSupabaseServerClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();

  // factorId tidak dipercaya dari form: harus milik akun ini dan berstatus sesuai.
  const wanted = state.status === "mfa-enroll" ? "unverified" : "verified";
  const requested = formData.get("factorId");
  const factor = (factors?.all ?? []).find(
    (f) =>
      f.factor_type === "totp" &&
      f.status === wanted &&
      (state.status === "mfa-verify" || f.id === requested),
  );
  if (!factor) return { error: CODE_FAILED };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.data,
  });
  if (error) return { error: CODE_FAILED };

  await recordAudit({
    actorId: state.admin.userId,
    action: state.status === "mfa-enroll" ? "auth.mfa_enrolled" : "auth.mfa_verified",
    entityType: "admin",
    entityId: state.admin.userId,
  });

  redirect("/admin");
}

/** Keluar. Boleh dipanggil siapa saja; tanpa sesi tidak ada efeknya. */
export async function logoutAction() {
  const state = await getAdminState();
  if (state.status === "ok") {
    await recordAudit({
      actorId: state.admin.userId,
      action: "auth.logout",
      entityType: "admin",
      entityId: state.admin.userId,
    });
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
