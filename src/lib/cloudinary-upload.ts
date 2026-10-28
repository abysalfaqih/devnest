/** Tiket unggah dari server: tanda tangan yang mengikat public_id, format, dan waktu. */
export type UploadTicket = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  allowedFormats: string;
};

/** Hasil unggahan yang dikirim kembali ke server untuk diverifikasi. */
export type UploadedAsset = {
  publicId: string;
  version: number;
  signature: string;
  width: number;
  height: number;
};

/** Mengunggah file langsung dari browser ke Cloudinary memakai tiket bertanda tangan. */
export function uploadToCloudinary(
  file: File,
  ticket: UploadTicket,
  onProgress?: (percent: number) => void,
): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ticket.uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: {
        public_id?: string;
        version?: number;
        signature?: string;
        width?: number;
        height?: number;
        error?: { message?: string };
      };
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Respons Cloudinary tidak dikenali."));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(body.error?.message ?? "Unggahan ditolak Cloudinary."));
        return;
      }
      if (!body.public_id || !body.version || !body.signature) {
        reject(new Error("Respons Cloudinary tidak lengkap."));
        return;
      }

      resolve({
        publicId: body.public_id,
        version: body.version,
        signature: body.signature,
        width: body.width ?? 0,
        height: body.height ?? 0,
      });
    };

    xhr.onerror = () => reject(new Error("Tidak bisa menghubungi Cloudinary. Periksa koneksi."));

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", ticket.apiKey);
    form.append("timestamp", String(ticket.timestamp));
    form.append("signature", ticket.signature);
    form.append("public_id", ticket.publicId);
    form.append("allowed_formats", ticket.allowedFormats);
    xhr.send(form);
  });
}
