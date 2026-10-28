"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { appFormSchema, fieldErrorsFromZod } from "@/features/apps/schema";
import type { UploadTicket } from "@/lib/cloudinary-upload";
import { requireAdmin } from "../auth/session";
import { revalidateCatalog } from "../cache";
import { createUploadTicket } from "../cloudinary";
import { createApp, setAppStatus, softDeleteApp, updateApp } from "./mutations";
import type { ActionResult, SaveAppState } from "./types";

const MAX_PAYLOAD_CHARS = 100_000;

/** Tiket untuk mengunggah logo langsung dari browser ke Cloudinary. */
export async function requestIconUploadTicketAction(): Promise<UploadTicket> {
  await requireAdmin();
  return createUploadTicket("icon");
}

/** Menyimpan aplikasi (baru jika tidak ada id, ubah jika ada id). */
export async function saveAppAction(
  _prev: SaveAppState,
  formData: FormData,
): Promise<SaveAppState> {
  const admin = await requireAdmin();

  const raw = formData.get("payload");
  if (typeof raw !== "string" || raw.length > MAX_PAYLOAD_CHARS) {
    return { error: "Data formulir tidak valid." };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "Data formulir tidak valid." };
  }

  const parsed = appFormSchema.safeParse(json);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian yang ditandai.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { id, ...rest } = parsed.data;
  const result = id ? await updateApp({ ...rest, id }, admin) : await createApp(parsed.data, admin);
  if (!result.ok) {
    // Pesan spesifik sudah tampil di kolomnya; jangan diulang di bagian bawah form.
    return {
      error: result.fieldErrors ? "Periksa kembali isian yang ditandai." : result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  revalidateCatalog();
  if (!id) redirect(`/admin/apps/${result.id}?baru=1`);
  return { savedAt: Date.now() };
}

const statusSchema = z.object({ id: z.uuid(), status: z.enum(["draft", "published"]) });

/** Menerbitkan atau menjadikan draf dari daftar aplikasi. */
export async function setStatusAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return { error: "Permintaan tidak valid." };

  const result = await setAppStatus(parsed.data.id, parsed.data.status, admin);
  if (!result.ok) return { error: result.error };

  revalidateCatalog();
  return {};
}

/** Hapus lunak, lalu kembali ke daftar. */
export async function deleteAppAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(formData.get("id"));
  if (id.success) {
    await softDeleteApp(id.data, admin);
    revalidateCatalog();
  }
  redirect("/admin/apps");
}
