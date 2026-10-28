"use client";

import { useState } from "react";
import cloudinaryLoader from "@/lib/cloudinary-loader";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { requestIconUploadTicketAction } from "@/server/apps/actions";

/** Logo yang sedang dipakai form. version dan signature hanya ada untuk unggahan baru. */
export type IconValue = {
  publicId: string;
  previewUrl: string;
  version?: number;
  signature?: string;
};

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type ImageUploaderProps = {
  value: IconValue | null;
  onChange: (value: IconValue | null) => void;
  error?: string;
};

export function ImageUploader({ value, onChange, error }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  async function handleFile(file: File) {
    setMessage(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage("Format harus PNG, JPG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("Ukuran file maksimal 5 MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const ticket = await requestIconUploadTicketAction();
      const asset = await uploadToCloudinary(file, ticket, setProgress);
      onChange({
        publicId: asset.publicId,
        version: asset.version,
        signature: asset.signature,
        previewUrl: URL.createObjectURL(file),
      });
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unggahan gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  const shownError = message ?? error;
  // Logo lama berasal dari Cloudinary: tampilkan versi kecil, bukan file aslinya.
  const previewSrc = value ? cloudinaryLoader({ src: value.previewUrl, width: 256 }) : null;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="size-24 shrink-0 overflow-hidden rounded-[22%] bg-surface ring-1 ring-ink/15">
        {previewSrc && previewSrc !== brokenSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal (blob) dan admin saja
          <img
            src={previewSrc}
            alt="Logo aplikasi"
            className="size-full object-cover"
            onError={() => setBrokenSrc(previewSrc)}
          />
        ) : (
          <span className="grid size-full place-items-center px-1 text-center text-sm text-muted">
            {previewSrc ? "Tidak termuat" : "Logo"}
          </span>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="icon-file"
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="peer sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleFile(file);
            }}
          />
          <label
            htmlFor="icon-file"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-brand px-5 text-sm font-semibold text-brand transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus) peer-disabled:pointer-events-none peer-disabled:opacity-50 hover:bg-brand hover:text-on-brand"
          >
            {uploading ? `Mengunggah... ${progress}%` : value ? "Ganti logo" : "Pilih logo"}
          </label>
          {value && !uploading ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex min-h-11 items-center px-2 text-sm text-muted underline underline-offset-4"
            >
              Hapus logo
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted">
          PNG, JPG, atau WebP, maksimal 5 MB. Disarankan persegi, minimal 512 x 512 px.
        </p>
        {shownError ? (
          <p role="alert" className="mt-1.5 text-sm font-semibold text-danger">
            {shownError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
