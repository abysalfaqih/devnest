import { z } from "zod";

/**
 * Validasi environment variable PUBLIK (aman dibaca browser).
 * Setiap variabel harus ditulis literal (process.env.NAMA) agar Next.js
 * bisa menyisipkan nilainya saat build.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ error: "NEXT_PUBLIC_SITE_URL harus berupa URL lengkap" }),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(`Environment variable tidak valid:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
