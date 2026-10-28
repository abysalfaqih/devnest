import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import type { AppFormInput } from "@/features/apps/schema";
import { slugify } from "@/features/apps/slug";
import { recordAudit } from "../audit";
import type { AdminIdentity } from "../auth/session";
import { deleteAsset, verifyAsset } from "../cloudinary";
import { db } from "../db";
import { isUniqueViolation } from "../db/errors";
import { appDownloadLinks, apps } from "../db/schema";
import { getAdminApp } from "./queries";

type SaveResult =
  { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

type SimpleResult = { ok: true } | { ok: false; error: string };

type IconValue = { iconPublicId: string; iconUrl: string } | null;

/**
 * Menentukan logo yang akan disimpan. Logo lama (publicId sama dengan di database)
 * dipertahankan; logo baru wajib lolos verifikasi tanda tangan Cloudinary.
 */
function resolveIcon(
  input: AppFormInput["icon"],
  current: { iconPublicId: string | null; iconUrl: string | null } | null,
): { ok: true; value: IconValue } | { ok: false; error: string } {
  if (!input) return { ok: true, value: null };

  if (current?.iconPublicId && current.iconUrl && input.publicId === current.iconPublicId) {
    return { ok: true, value: { iconPublicId: current.iconPublicId, iconUrl: current.iconUrl } };
  }

  if (!input.version || !input.signature) {
    return { ok: false, error: "Logo tidak sah. Unggah ulang logonya." };
  }
  const verified = verifyAsset(
    { publicId: input.publicId, version: input.version, signature: input.signature },
    "icon",
  );
  if (!verified) return { ok: false, error: "Logo tidak sah. Unggah ulang logonya." };

  return { ok: true, value: { iconPublicId: verified.publicId, iconUrl: verified.url } };
}

/** Membuat aplikasi baru. Slug dibuat otomatis dari nama dan dijamin unik oleh database. */
export async function createApp(input: AppFormInput, admin: AdminIdentity): Promise<SaveResult> {
  const icon = resolveIcon(input.icon, null);
  if (!icon.ok) return { ok: false, error: icon.error, fieldErrors: { icon: icon.error } };

  const base = slugify(input.name);

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    try {
      const id = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(apps)
          .values({
            slug,
            name: input.name,
            summary: input.summary,
            description: input.description,
            version: input.version,
            size: input.size,
            checksumSha256: input.checksum,
            iconUrl: icon.value?.iconUrl ?? null,
            iconPublicId: icon.value?.iconPublicId ?? null,
            status: input.status,
          })
          .returning({ id: apps.id });

        if (input.links.length > 0) {
          await tx.insert(appDownloadLinks).values(
            input.links.map((link, position) => ({
              appId: row.id,
              position,
              label: link.label,
              url: link.url,
            })),
          );
        }

        await recordAudit(
          {
            actorId: admin.userId,
            action: "app.create",
            entityType: "app",
            entityId: row.id,
            meta: { slug, status: input.status },
          },
          tx,
        );
        return row.id;
      });
      return { ok: true, id };
    } catch (error) {
      if (isUniqueViolation(error, "apps_slug_key")) continue;
      throw error;
    }
  }

  return {
    ok: false,
    error: "Tidak bisa membuat alamat unik untuk nama ini. Ubah sedikit namanya.",
  };
}

/** Mengubah aplikasi. Slug tidak pernah berubah (dijaga juga oleh trigger database). */
export async function updateApp(
  input: AppFormInput & { id: string },
  admin: AdminIdentity,
): Promise<SaveResult> {
  const current = await getAdminApp(input.id);
  if (!current) return { ok: false, error: "Aplikasi tidak ditemukan atau sudah dihapus." };

  const icon = resolveIcon(input.icon, current);
  if (!icon.ok) return { ok: false, error: icon.error, fieldErrors: { icon: icon.error } };

  const changed = [
    input.name !== current.name && "name",
    input.summary !== current.summary && "summary",
    input.description !== current.description && "description",
    input.version !== current.version && "version",
    input.size !== current.size && "size",
    input.checksum !== current.checksumSha256 && "checksum",
    icon.value?.iconPublicId !== (current.iconPublicId ?? undefined) && "icon",
    JSON.stringify(input.links) !==
      JSON.stringify(current.downloadLinks.map(({ label, url }) => ({ label, url }))) && "links",
    input.status !== current.status && "status",
  ].filter(Boolean);

  await db.transaction(async (tx) => {
    await tx
      .update(apps)
      .set({
        name: input.name,
        summary: input.summary,
        description: input.description,
        version: input.version,
        size: input.size,
        checksumSha256: input.checksum,
        iconUrl: icon.value?.iconUrl ?? null,
        iconPublicId: icon.value?.iconPublicId ?? null,
        status: input.status,
      })
      .where(eq(apps.id, input.id));

    // Tombol unduh diperbarui per posisi agar ID-nya stabil, sisanya dihapus.
    if (input.links.length > 0) {
      await tx
        .insert(appDownloadLinks)
        .values(
          input.links.map((link, position) => ({
            appId: input.id,
            position,
            label: link.label,
            url: link.url,
          })),
        )
        .onConflictDoUpdate({
          target: [appDownloadLinks.appId, appDownloadLinks.position],
          set: { label: sql`excluded.label`, url: sql`excluded.url` },
        });
    }
    await tx
      .delete(appDownloadLinks)
      .where(
        and(
          eq(appDownloadLinks.appId, input.id),
          gte(appDownloadLinks.position, input.links.length),
        ),
      );

    await recordAudit(
      {
        actorId: admin.userId,
        action: "app.update",
        entityType: "app",
        entityId: input.id,
        meta: { slug: current.slug, changed, from: current.status, to: input.status },
      },
      tx,
    );
  });

  // Hapus logo lama dari Cloudinary hanya setelah database berhasil diperbarui.
  if (current.iconPublicId && current.iconPublicId !== icon.value?.iconPublicId) {
    await deleteAsset(current.iconPublicId, "icon");
  }

  return { ok: true, id: input.id };
}

/** Menerbitkan atau menjadikan draf. Menerbitkan butuh logo dan minimal satu tombol unduh. */
export async function setAppStatus(
  id: string,
  status: "draft" | "published",
  admin: AdminIdentity,
): Promise<SimpleResult> {
  const current = await getAdminApp(id);
  if (!current) return { ok: false, error: "Aplikasi tidak ditemukan." };

  if (status === "published") {
    if (!current.iconUrl) return { ok: false, error: "Tambahkan logo dulu sebelum menerbitkan." };
    if (current.downloadLinks.length === 0) {
      return { ok: false, error: "Tambahkan minimal satu tombol unduh sebelum menerbitkan." };
    }
  }

  await db.transaction(async (tx) => {
    await tx.update(apps).set({ status }).where(eq(apps.id, id));
    await recordAudit(
      {
        actorId: admin.userId,
        action: status === "published" ? "app.publish" : "app.unpublish",
        entityType: "app",
        entityId: id,
        meta: { slug: current.slug },
      },
      tx,
    );
  });
  return { ok: true };
}

/** Hapus lunak: baris tetap ada (slug tidak dipakai ulang), hanya disembunyikan. */
export async function softDeleteApp(id: string, admin: AdminIdentity): Promise<SimpleResult> {
  const current = await getAdminApp(id);
  if (!current) return { ok: false, error: "Aplikasi tidak ditemukan." };

  await db.transaction(async (tx) => {
    await tx
      .update(apps)
      .set({ deletedAt: sql`now()`, status: "draft" })
      .where(eq(apps.id, id));
    await recordAudit(
      {
        actorId: admin.userId,
        action: "app.delete",
        entityType: "app",
        entityId: id,
        meta: { slug: current.slug },
      },
      tx,
    );
  });
  return { ok: true };
}
