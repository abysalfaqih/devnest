import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "../db";
import { admins } from "../db/schema";
import { createSupabaseServerClient } from "./supabase";

export type AdminIdentity = { userId: string; email: string };

export type AdminState =
  | { status: "anonymous" }
  | { status: "not-admin"; userId: string }
  | { status: "mfa-enroll"; admin: AdminIdentity }
  | { status: "mfa-verify"; admin: AdminIdentity }
  | { status: "ok"; admin: AdminIdentity };

export async function isAdminUser(userId: string) {
  const rows = await db
    .select({ userId: admins.userId })
    .from(admins)
    .where(eq(admins.userId, userId))
    .limit(1);
  return rows.length > 0;
}

/**
 * Status login saat ini. Diperiksa langsung ke Supabase Auth (getUser), bukan
 * hanya membaca cookie, sehingga sesi yang sudah dicabut langsung tidak berlaku.
 * Hasilnya di-cache selama satu request.
 */
export const getAdminState = cache(async (): Promise<AdminState> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user) return { status: "anonymous" };

  if (!(await isAdminUser(user.id))) return { status: "not-admin", userId: user.id };

  const admin: AdminIdentity = { userId: user.id, email: user.email ?? "" };

  // Level login dari klaim JWT yang diverifikasi. Daftar faktor MFA dari getUser()
  // (langsung dari Supabase Auth), bukan dari data user yang tersimpan di cookie.
  const { data: claimsData } = await supabase.auth.getClaims();
  const hasVerifiedFactor = (user.factors ?? []).some((factor) => factor.status === "verified");

  if (claimsData?.claims.aal === "aal2") return { status: "ok", admin };
  if (hasVerifiedFactor) return { status: "mfa-verify", admin };
  return { status: "mfa-enroll", admin };
});

/**
 * Wajib dipanggil di SETIAP halaman admin dan SETIAP aksi admin. Layout tidak
 * cukup, karena layout tidak dijalankan ulang saat berpindah halaman.
 * Hanya admin yang sudah lolos MFA (aal2) yang diloloskan.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const state = await getAdminState();

  switch (state.status) {
    case "ok":
      return state.admin;
    case "mfa-enroll":
    case "mfa-verify":
      redirect("/admin/mfa");
    case "not-admin":
    case "anonymous":
      redirect("/admin/login");
  }
}
