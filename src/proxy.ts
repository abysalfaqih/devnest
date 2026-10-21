import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions } from "./server/auth/cookies";

function protect(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

/**
 * Berjalan hanya untuk /admin. Tugasnya: menyegarkan sesi Supabase agar token
 * tidak kedaluwarsa, mengarahkan pengunjung ke login atau MFA lewat redirect
 * HTTP yang benar, dan melarang caching serta pengindeksan.
 *
 * INI BUKAN PENJAGA UTAMA. Setiap halaman dan aksi admin tetap memeriksa
 * sendiri lewat requireAdmin().
 */
export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return new NextResponse("Konfigurasi server belum lengkap.", { status: 500 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, authCookieOptions(options));
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";
  const isMfaPage = path === "/admin/mfa";

  function redirectTo(target: string) {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    // Bawa cookie hasil penyegaran sesi (atau penghapusan) ke respons redirect.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return protect(redirect);
  }

  if (!claims && !isLoginPage) return redirectTo("/admin/login");
  if (claims && claims.aal !== "aal2" && !isLoginPage && !isMfaPage)
    return redirectTo("/admin/mfa");

  return protect(response);
}

export const config = { matcher: ["/admin/:path*"] };
