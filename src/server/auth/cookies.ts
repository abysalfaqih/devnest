import type { CookieOptions } from "@supabase/ssr";

/**
 * Cookie sesi admin: tidak terbaca JavaScript (httpOnly), hanya dikirim ke
 * jalur /admin, dan hanya lewat HTTPS di production. Dipakai oleh proxy dan server.
 */
export function authCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}
