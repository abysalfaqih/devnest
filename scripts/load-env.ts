/**
 * Memuat .env.local untuk skrip di luar Next.js (drizzle-kit, seed, db-check).
 * Diimpor paling awal agar variabel sudah tersedia untuk file lain.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // File tidak ada (misalnya di CI): pakai variabel dari proses.
}
