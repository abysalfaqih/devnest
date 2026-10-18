import type { AdBanner } from "./types";

/** DATA CONTOH. Dihapus di Fase 7, saat banner dikelola dari halaman admin. */
export const sampleBanners: AdBanner[] = [
  {
    id: "b1",
    title: "Catatan Kilat 2.4 sudah rilis",
    subtitle: "Sinkronisasi offline lebih cepat dan tampilan yang lebih lega.",
    imageUrl: null,
    imageAlt: "Catatan Kilat 2.4 sudah rilis",
    href: "/apps",
    tone: "moss",
  },
  {
    id: "b2",
    title: "Tempat iklan Anda di sini",
    subtitle: "Banner ini dikelola dari halaman admin dan bisa diganti kapan saja.",
    imageUrl: null,
    imageAlt: "Tempat iklan Anda di sini",
    href: "https://example.com",
    tone: "marigold",
  },
  {
    id: "b3",
    title: "KasKu: catat uang tanpa ribet",
    subtitle: "Tanpa iklan dan tanpa langganan.",
    imageUrl: null,
    imageAlt: "KasKu: catat uang tanpa ribet",
    href: "https://example.com",
    tone: "ink",
  },
];
