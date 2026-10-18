export type AdTone = "moss" | "marigold" | "ink";

export type AdBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  /** Gambar banner (rasio 2:1). Jika kosong, tampil panel teks. */
  imageUrl: string | null;
  imageAlt: string;
  href: string;
  tone?: AdTone;
};
