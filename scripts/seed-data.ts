/**
 * DATA CONTOH untuk pengembangan. Semua nama dan link fiktif.
 * Hapus datanya sebelum launch (lihat docs/PROGRESS.md).
 */
export const seedDescription = `Aplikasi contoh untuk menguji tampilan Devnest.

## Fitur utama

- Ringan dan cepat dibuka
- Bisa dipakai tanpa internet
- Tanpa iklan

Teks ini ditulis dengan Markdown dan akan dibersihkan sebelum ditampilkan.`;

type SeedApp = {
  slug: string;
  name: string;
  summary: string;
  version: string;
  size: string;
  status: "draft" | "published";
  links: { label: string; url: string }[];
};

export const seedApps: SeedApp[] = [
  {
    slug: "catatan-kilat",
    name: "Catatan Kilat",
    summary: "Catat ide dalam hitungan detik, tetap bisa dipakai tanpa internet.",
    version: "2.4.1",
    size: "18 MB",
    status: "published",
    links: [
      { label: "Unduh APK", url: "https://example.com/download/catatan-kilat" },
      { label: "Cadangan", url: "https://example.com/mirror/catatan-kilat" },
    ],
  },
  {
    slug: "kasku",
    name: "KasKu",
    summary: "Pencatat pemasukan dan pengeluaran harian yang rapi dan tanpa iklan.",
    version: "1.8.0",
    size: "24 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/kasku" }],
  },
  {
    slug: "port-scout",
    name: "Port Scout",
    summary: "Pindai port perangkat di jaringan lokal langsung dari ponsel.",
    version: "0.9.3",
    size: "12 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/port-scout" }],
  },
  {
    slug: "berkas-bersih",
    name: "Berkas Bersih",
    summary: "Temukan file duplikat dan cache lama, lalu hapus dengan aman.",
    version: "3.1.0",
    size: "9,6 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/berkas-bersih" }],
  },
  {
    slug: "pustaka",
    name: "Pustaka",
    summary: "Pembaca e-book EPUB yang ringan dengan mode baca malam.",
    version: "1.2.5",
    size: "21 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/pustaka" }],
  },
  {
    slug: "sketsa",
    name: "Sketsa",
    summary: "Papan gambar minimalis untuk menuangkan ide sebelum hilang.",
    version: "2.0.0",
    size: "33 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/sketsa" }],
  },
  {
    slug: "jam-fokus",
    name: "Jam Fokus",
    summary: "Timer pomodoro dengan statistik waktu fokus mingguan.",
    version: "1.4.2",
    size: "7,2 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/jam-fokus" }],
  },
  {
    slug: "konversi",
    name: "Konversi",
    summary: "Ubah satuan dan mata uang secara offline, cukup satu ketukan.",
    version: "4.0.1",
    size: "5,8 MB",
    status: "published",
    links: [{ label: "Unduh APK", url: "https://example.com/download/konversi" }],
  },
  {
    // Sengaja berstatus draf untuk menguji bahwa draf tidak tampil di publik.
    slug: "draf-uji-coba",
    name: "Draf Uji Coba",
    summary: "Aplikasi berstatus draf. Tidak boleh muncul di halaman publik.",
    version: "0.1.0",
    size: "3 MB",
    status: "draft",
    links: [{ label: "Unduh APK", url: "https://example.com/download/draf-uji-coba" }],
  },
];

export const seedBanners = [
  {
    title: "Catatan Kilat 2.4 sudah rilis",
    subtitle: "Sinkronisasi offline lebih cepat dan tampilan yang lebih lega.",
    imageAlt: "Catatan Kilat 2.4 sudah rilis",
    targetUrl: "/apps",
    tone: "moss",
  },
  {
    title: "Tempat iklan Anda di sini",
    subtitle: "Banner ini dikelola dari halaman admin dan bisa diganti kapan saja.",
    imageAlt: "Tempat iklan Anda di sini",
    targetUrl: "https://example.com",
    tone: "marigold",
  },
  {
    title: "KasKu: catat uang tanpa ribet",
    subtitle: "Tanpa iklan dan tanpa langganan.",
    imageAlt: "KasKu: catat uang tanpa ribet",
    targetUrl: "https://example.com",
    tone: "ink",
  },
] as const;
