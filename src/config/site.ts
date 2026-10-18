export const siteConfig = {
  name: "Devnest",
  description: "Tempat saya membagikan aplikasi buatan sendiri.",
  /** Jumlah aplikasi di beranda sebelum tombol "Lihat semua aplikasi" muncul. */
  homeAppLimit: 6,
  nav: [
    { href: "/", label: "Beranda" },
    { href: "/apps", label: "Aplikasi" },
  ],
  legal: [
    { href: "/terms", label: "Syarat Layanan" },
    { href: "/privacy", label: "Kebijakan Privasi" },
    { href: "/disclaimer", label: "Disclaimer" },
  ],
} as const;
