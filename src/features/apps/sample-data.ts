import type { AppSummary } from "./types";

/**
 * DATA CONTOH untuk membangun tampilan. Semua nama fiktif.
 * File ini dihapus di Fase 5, saat halaman memakai data dari database.
 */
export const sampleApps: AppSummary[] = [
  {
    id: "1",
    slug: "catatan-kilat",
    name: "Catatan Kilat",
    summary: "Catat ide dalam hitungan detik, tetap bisa dipakai tanpa internet.",
    version: "2.4.1",
    size: "18 MB",
    iconUrl: null,
  },
  {
    id: "2",
    slug: "kasku",
    name: "KasKu",
    summary: "Pencatat pemasukan dan pengeluaran harian yang rapi dan tanpa iklan.",
    version: "1.8.0",
    size: "24 MB",
    iconUrl: null,
  },
  {
    id: "3",
    slug: "port-scout",
    name: "Port Scout",
    summary: "Pindai port perangkat di jaringan lokal langsung dari ponsel.",
    version: "0.9.3",
    size: "12 MB",
    iconUrl: null,
  },
  {
    id: "4",
    slug: "berkas-bersih",
    name: "Berkas Bersih",
    summary: "Temukan file duplikat dan cache lama, lalu hapus dengan aman.",
    version: "3.1.0",
    size: "9,6 MB",
    iconUrl: null,
  },
  {
    id: "5",
    slug: "pustaka",
    name: "Pustaka",
    summary: "Pembaca e-book EPUB yang ringan dengan mode baca malam.",
    version: "1.2.5",
    size: "21 MB",
    iconUrl: null,
  },
  {
    id: "6",
    slug: "sketsa",
    name: "Sketsa",
    summary: "Papan gambar minimalis untuk menuangkan ide sebelum hilang.",
    version: "2.0.0",
    size: "33 MB",
    iconUrl: null,
  },
  {
    id: "7",
    slug: "jam-fokus",
    name: "Jam Fokus",
    summary: "Timer pomodoro dengan statistik waktu fokus mingguan.",
    version: "1.4.2",
    size: "7,2 MB",
    iconUrl: null,
  },
  {
    id: "8",
    slug: "konversi",
    name: "Konversi",
    summary: "Ubah satuan dan mata uang secara offline, cukup satu ketukan.",
    version: "4.0.1",
    size: "5,8 MB",
    iconUrl: null,
  },
];
