import "server-only";
import { updateTag } from "next/cache";

/**
 * Menandai data katalog publik (daftar dan detail aplikasi, banner) sebagai
 * kedaluwarsa. Hanya boleh dipanggil dari Server Action. Halaman publik
 * memakai tag "catalog" di Fase 5.
 */
export function revalidateCatalog() {
  updateTag("catalog");
}
