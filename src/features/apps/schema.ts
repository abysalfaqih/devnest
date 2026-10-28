import { z } from "zod";
import { limits } from "@/config/limits";

/** Sama dengan constraint di database: https, tanpa spasi, tanpa "user@" di host. */
const HTTPS_URL = /^https:\/\/[^/@\s]+([/?#]\S*)?$/;

const assetRef = z.object({
  publicId: z.string().max(200),
  version: z.number().int().positive().optional(),
  signature: z.string().max(128).optional(),
});

export const appFormSchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi.")
      .max(limits.app.name, `Maksimal ${limits.app.name} karakter.`),
    summary: z
      .string()
      .trim()
      .min(1, "Ringkasan wajib diisi.")
      .max(limits.app.summary, `Maksimal ${limits.app.summary} karakter.`),
    description: z
      .string()
      .max(limits.app.description, `Maksimal ${limits.app.description} karakter.`)
      .transform((value) => value.trim()),
    version: z
      .string()
      .trim()
      .min(1, "Versi wajib diisi.")
      .max(limits.app.version, `Maksimal ${limits.app.version} karakter.`),
    size: z
      .string()
      .trim()
      .min(1, "Ukuran wajib diisi.")
      .max(limits.app.size, `Maksimal ${limits.app.size} karakter.`),
    checksum: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (value) => value === "" || /^[a-f0-9]{64}$/.test(value),
        "Checksum harus 64 karakter heksadesimal (SHA-256).",
      )
      .transform((value) => (value === "" ? null : value)),
    status: z.enum(["draft", "published"]),
    icon: assetRef.nullable(),
    links: z
      .array(
        z.object({
          label: z
            .string()
            .trim()
            .min(1, "Label wajib diisi.")
            .max(limits.downloadLink.label, `Maksimal ${limits.downloadLink.label} karakter.`),
          url: z
            .string()
            .trim()
            .max(limits.downloadLink.url, "Link terlalu panjang.")
            .regex(HTTPS_URL, "Link harus diawali https:// dan tidak boleh berisi spasi."),
        }),
      )
      .max(limits.app.downloadLinks, `Maksimal ${limits.app.downloadLinks} tombol unduh.`),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "published") return;
    if (!data.icon) {
      ctx.addIssue({
        code: "custom",
        path: ["icon"],
        message: "Logo wajib ada untuk menerbitkan aplikasi.",
      });
    }
    if (data.links.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["links"],
        message: "Minimal satu tombol unduh untuk menerbitkan aplikasi.",
      });
    }
  });

export type AppFormInput = z.output<typeof appFormSchema>;

/** Mengubah galat Zod menjadi { "links.0.url": "pesan" } (pesan pertama per kolom). */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
