import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "../env";
import { authCookieOptions } from "./cookies";

/**
 * Klien Supabase untuk Server Component dan Server Action. Wajib dibuat baru
 * di setiap request. Hanya dipakai untuk autentikasi; semua data lewat Drizzle.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, authCookieOptions(options));
          }
        } catch {
          // Dipanggil dari Server Component, yang tidak boleh menulis cookie.
          // Aman diabaikan: proxy.ts yang menyegarkan sesi.
        }
      },
    },
  });
}
