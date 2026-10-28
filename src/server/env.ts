import "server-only";
import { z } from "zod";

/**
 * Validasi environment variable RAHASIA (hanya server). File ini tidak boleh
 * diimpor dari komponen client. Variabel baru ditambahkan di sini per fase.
 */

/** Menolak kunci rahasia Supabase yang tertukar ke variabel kunci publishable. */
function isNotSecretKey(value: string) {
  if (value.startsWith("sb_secret_")) return false;
  const parts = value.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      return payload.role !== "service_role";
    } catch {
      return true;
    }
  }
  return true;
}

const serverEnvSchema = z.object({
  /** Koneksi runtime sebagai role devnest_app lewat Transaction pooler (port 6543). */
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "DATABASE_URL harus berupa URL postgres:// atau postgresql://",
  }),
  /** Project URL Supabase, misalnya https://abcdefgh.supabase.co */
  SUPABASE_URL: z.url({
    protocol: /^https?$/,
    error: "SUPABASE_URL harus berupa URL lengkap, misalnya https://xxxx.supabase.co",
  }),
  /** Kunci publishable (sb_publishable_...). JANGAN isi dengan kunci secret atau service_role. */
  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "SUPABASE_PUBLISHABLE_KEY terlalu pendek")
    .refine(
      isNotSecretKey,
      "SUPABASE_PUBLISHABLE_KEY berisi kunci RAHASIA. Pakai kunci publishable.",
    ),
  /** Cloudinary: salin "API Environment variable" dari dashboard (Settings, API Keys). */
  CLOUDINARY_URL: z
    .string()
    .regex(
      /^cloudinary:\/\/[^:\s]+:[^@\s]+@[^/?\s]+/,
      "CLOUDINARY_URL harus berbentuk cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
    ),
});

const parsed = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
});

if (!parsed.success) {
  throw new Error(`Environment variable server tidak valid:\n${z.prettifyError(parsed.error)}`);
}

export const serverEnv = parsed.data;
