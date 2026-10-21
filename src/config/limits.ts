/**
 * Batas data. Satu sumber untuk constraint database dan validasi form (Zod),
 * supaya keduanya tidak pernah berbeda. Mengubah angka di sini menghasilkan
 * migrasi baru lewat `pnpm db:generate`.
 */
export const limits = {
  app: {
    name: 60,
    summary: 140,
    description: 20_000,
    version: 32,
    size: 32,
    downloadLinks: 3,
    screenshots: 8,
    recommendations: 3,
  },
  downloadLink: { label: 40, url: 2048 },
  banner: { title: 80, subtitle: 160, imageAlt: 160, url: 2048 },
  legal: { title: 120, content: 100_000 },
  audit: { action: 60, entityType: 40, metaBytes: 8192 },
} as const;
