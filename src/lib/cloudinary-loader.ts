"use client";

const UPLOAD_MARKER = "/image/upload/";

/**
 * Loader gambar untuk next/image: gambar disajikan langsung oleh CDN Cloudinary
 * dengan ukuran, format (WebP/AVIF), dan kualitas otomatis. URL selain
 * Cloudinary dikembalikan apa adanya.
 */
export default function cloudinaryLoader({ src, width }: { src: string; width: number }) {
  const index = src.indexOf(UPLOAD_MARKER);
  if (!src.startsWith("https://res.cloudinary.com/") || index === -1) return src;

  const head = src.slice(0, index + UPLOAD_MARKER.length);
  const tail = src.slice(index + UPLOAD_MARKER.length);
  return `${head}f_auto,q_auto,c_limit,w_${width}/${tail}`;
}
