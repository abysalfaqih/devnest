import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { UploadTicket } from "@/lib/cloudinary-upload";
import "./env";

// Konfigurasi dibaca dari CLOUDINARY_URL (sudah divalidasi oleh ./env).
cloudinary.config({ secure: true, urlAnalytics: false });

const FOLDERS = { icon: "devnest/icons" } as const;
export type ImageKind = keyof typeof FOLDERS;

/** Format yang diizinkan. SVG sengaja tidak diizinkan. */
const ALLOWED_FORMATS = "jpg,jpeg,png,webp";

export type AssetRef = { publicId: string; version: number; signature: string };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

function publicIdPattern(kind: ImageKind) {
  return new RegExp(`^${FOLDERS[kind]}/${UUID}$`);
}

/**
 * Membuat tiket unggah. public_id dibuat server dan ikut ditandatangani,
 * jadi browser tidak bisa menimpa gambar lain atau memilih lokasi sendiri.
 */
export function createUploadTicket(kind: ImageKind): UploadTicket {
  const { api_key: apiKey, api_secret: apiSecret } = cloudinary.config();
  if (!apiKey || !apiSecret) throw new Error("Konfigurasi Cloudinary tidak lengkap.");

  const publicId = `${FOLDERS[kind]}/${randomUUID()}`;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { allowed_formats: ALLOWED_FORMATS, public_id: publicId, timestamp },
    apiSecret,
  );

  return {
    uploadUrl: cloudinary.utils.api_url("upload", { resource_type: "image" }),
    apiKey,
    timestamp,
    signature,
    publicId,
    allowedFormats: ALLOWED_FORMATS,
  };
}

/** URL penyaji gambar. Dibentuk server, bukan diterima dari browser. */
export function assetUrl(publicId: string, version: number) {
  return cloudinary.url(publicId, {
    version,
    secure: true,
    type: "upload",
    resource_type: "image",
  });
}

/**
 * Memastikan gambar benar-benar diunggah memakai tiket kita: public_id harus
 * berpola milik kita dan tanda tangan respons Cloudinary (atas public_id dan
 * version, dihitung dengan API secret) harus cocok. Mengembalikan null jika tidak sah.
 */
export function verifyAsset(ref: AssetRef, kind: ImageKind) {
  if (!publicIdPattern(kind).test(ref.publicId)) return null;
  if (!Number.isSafeInteger(ref.version) || ref.version <= 0) return null;

  const apiSecret = cloudinary.config().api_secret;
  if (!apiSecret) throw new Error("Konfigurasi Cloudinary tidak lengkap.");

  const expected = Buffer.from(
    cloudinary.utils.api_sign_request(
      { public_id: ref.publicId, version: String(ref.version) },
      apiSecret,
    ),
  );
  const actual = Buffer.from(ref.signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return { publicId: ref.publicId, url: assetUrl(ref.publicId, ref.version) };
}

/** Menghapus gambar milik kita dari Cloudinary. Gagal tidak menghentikan proses. */
export async function deleteAsset(publicId: string, kind: ImageKind) {
  if (!publicIdPattern(kind).test(publicId)) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error(`[cloudinary] gagal menghapus ${publicId}:`, error);
  }
}
