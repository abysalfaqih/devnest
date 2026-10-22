# Devnest: Progress dan Keputusan

Terakhir diperbarui: 2026-10-18

Tempel isi file ini di awal chat baru agar mentor langsung tahu posisi kita.

## Status fase

- [x] Fase 0: Persiapan (tools, akun, repo, lint, env, CI)
- [x] Fase 1: Design system + layout dengan data contoh (beranda, banner, daftar aplikasi)
- [ ] Fase 2: Skema database + migrasi + seed
- [ ] Fase 3: Auth admin + shell halaman admin
- [ ] Fase 4: Admin manage aplikasi
- [ ] Fase 5: Halaman publik (Home, All Apps, Detail)
- [ ] Fase 6: Sistem verifikasi 3 step (dijaga server)
- [ ] Fase 7: Banner iklan, halaman legal, site settings
- [ ] Fase 8: Dashboard statistik realtime
- [ ] Fase 9: SEO lengkap (hapus noindex sementara di `src/app/layout.tsx`)
- [ ] Fase 10: Hardening keamanan + testing (CSP, rate limit, Vitest, Playwright)
- [ ] Fase 11: Deploy, domain, monitoring, backup

## Keputusan teknis

- Node.js 24 LTS (`.nvmrc` dan `engines.node`). Dipaksa lewat `engineStrict` di `pnpm-workspace.yaml`.
- pnpm 12.14.0, versi dikunci di `packageManager`. Skrip build dependency harus disetujui lewat `allowBuilds`.
- Next.js 16.4.x (App Router) dengan Cache Components aktif. Minimal 16.4.1 karena patch keamanan 14 Okt 2026.
- TypeScript 5.9.x. Jangan naik ke 7.x dulu: typescript-eslint belum mendukungnya.
- Tailwind CSS 4 lewat `@tailwindcss/turbopack`.
- Zod 4 untuk validasi (env dan semua input).
- Database Supabase (Postgres), gambar Cloudinary, rate limit Upstash Redis, hosting Vercel.
- Bahasa situs: Indonesia (`lang="id"`).
- Semua versi dependency dikunci eksak. Pembaruan lewat Dependabot dan ditinjau manual.
- Aturan Cache Components untuk panel admin: (1) `createSupabaseServerClient()` selalu diawali `await connection()` karena klien Supabase memakai `Date.now()`; (2) setiap halaman atau layout yang membaca sesi (memanggil `requireAdmin()` atau `getAdminState()`) wajib `export const instant = false` (hanya berlaku untuk segmen yang mengekspornya); (3) pengujian e2e wajib dijalankan di mode dev DAN produksi. Halaman publik di Fase 5 TIDAK memakai `instant = false`; di sana datanya di-cache dengan `"use cache"` dan bagian dinamis dibungkus Suspense.

## Aturan struktur

- `src/app`: hanya routing, layout, dan halaman tipis.
- `src/features/<fitur>`: logika per fitur (apps, ads, verification, legal, settings, analytics, auth).
- `src/components/ui`: komponen UI umum tanpa logika bisnis.
- `src/lib`: utilitas bersama dan validasi env.
- `src/server`: kode yang hanya boleh jalan di server (wajib `import "server-only"`).
- Rahasia hanya di `.env.local` dan dashboard Vercel, tidak pernah di git.

- Logo: huruf "d" putih dengan titik hijau (#01EA75) di kotak gelap (#141414), dilacak dari JPG asli menjadi vektor di `src/components/layout/logo.tsx`. Favicon dan ikon iPhone dibuat dari jalur yang sama lewat `src/app/icon.tsx` dan `src/app/apple-icon.tsx`. Palet situs tidak berubah.
- Logo asli (JPG 960x960) ada di `docs/brand/`. Jika desainer punya file vektor (SVG, AI, atau Figma), ganti `LOGO_PATH` agar lebih presisi.

## Catatan operasional

- Vercel Hobby hanya untuk non-komersial (donasi dan iklan berbayar dihitung komersial). Cron Hobby maksimal sekali sehari.
- Supabase Free: project di-pause setelah 7 hari tanpa aktivitas dan tidak ada backup harian. Pertimbangkan Pro sebelum launch.
