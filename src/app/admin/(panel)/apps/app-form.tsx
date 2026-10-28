"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { limits } from "@/config/limits";
import { saveAppAction } from "@/server/apps/actions";
import type { SaveAppState } from "@/server/apps/types";
import { ImageUploader, type IconValue } from "./image-uploader";
import { LinksEditor, type LinkValue } from "./links-editor";

export type AppFormInitial = {
  id?: string;
  slug?: string;
  name: string;
  summary: string;
  description: string;
  version: string;
  size: string;
  checksum: string;
  status: "draft" | "published";
  icon: IconValue | null;
  links: LinkValue[];
};

const initialState: SaveAppState = {};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

export function AppForm({ initial }: { initial: AppFormInitial }) {
  const [state, formAction, pending] = useActionState(saveAppAction, initialState);

  const [name, setName] = useState(initial.name);
  const [summary, setSummary] = useState(initial.summary);
  const [description, setDescription] = useState(initial.description);
  const [version, setVersion] = useState(initial.version);
  const [size, setSize] = useState(initial.size);
  const [checksum, setChecksum] = useState(initial.checksum);
  const [status, setStatus] = useState(initial.status);
  const [icon, setIcon] = useState(initial.icon);
  const [links, setLinks] = useState(initial.links);
  const [dismissedAt, setDismissedAt] = useState(0);

  const errors = state.fieldErrors ?? {};
  const showSaved = state.savedAt !== undefined && state.savedAt !== dismissedAt;

  // Seluruh isi form dikirim sebagai satu JSON, lalu divalidasi ulang di server.
  const payload = JSON.stringify({
    id: initial.id,
    name,
    summary,
    description,
    version,
    size,
    checksum,
    status,
    icon: icon
      ? { publicId: icon.publicId, version: icon.version, signature: icon.signature }
      : null,
    links: links.map(({ label, url }) => ({ label, url })),
  });

  return (
    <form
      action={formAction}
      noValidate
      onChange={() => {
        if (state.savedAt) setDismissedAt(state.savedAt);
      }}
      className="space-y-12"
    >
      <input type="hidden" name="payload" value={payload} />

      <Section title="Logo">
        <ImageUploader value={icon} onChange={setIcon} error={errors.icon} />
      </Section>

      <Section title="Informasi dasar">
        <Field
          id="name"
          label="Nama aplikasi"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={limits.app.name}
          autoComplete="off"
          error={errors.name}
          hint={
            initial.slug
              ? `Alamat halaman: /apps/${initial.slug} (permanen, tidak ikut berubah bila nama diubah).`
              : "Alamat halaman dibuat otomatis dari nama dan tidak bisa diubah setelahnya."
          }
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="version"
            label="Versi"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            maxLength={limits.app.version}
            autoComplete="off"
            placeholder="1.0.0"
            error={errors.version}
          />
          <Field
            id="size"
            label="Ukuran"
            value={size}
            onChange={(event) => setSize(event.target.value)}
            maxLength={limits.app.size}
            autoComplete="off"
            placeholder="18 MB"
            error={errors.size}
          />
        </div>
        <Field
          id="summary"
          label="Ringkasan"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          maxLength={limits.app.summary}
          autoComplete="off"
          error={errors.summary}
          hint={`${summary.length} dari ${limits.app.summary} karakter. Tampil di daftar dan hasil pencarian.`}
        />
      </Section>

      <Section title="Deskripsi">
        <TextareaField
          id="description"
          label="Deskripsi lengkap"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={10}
          maxLength={limits.app.description}
          error={errors.description}
          hint={`${description.length} dari ${limits.app.description} karakter. Mendukung Markdown (judul, daftar, huruf tebal).`}
        />
        <Field
          id="checksum"
          label="Checksum SHA-256 (opsional)"
          value={checksum}
          onChange={(event) => setChecksum(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-sm"
          error={errors.checksum}
          hint="Membantu pengunjung memastikan file yang diunduh tidak diubah."
        />
      </Section>

      <Section title="Tombol unduh">
        <LinksEditor links={links} onChange={setLinks} errors={errors} />
      </Section>

      <Section title="Status">
        <fieldset>
          <legend className="sr-only">Status aplikasi</legend>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["draft", "Draf"],
                ["published", "Terbit"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-muted px-5 text-sm font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-on-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus)"
              >
                <input
                  type="radio"
                  name="status-choice"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            Draf tidak tampil di situs publik. Menerbitkan butuh logo dan minimal satu tombol unduh.
          </p>
        </fieldset>
      </Section>

      <div className="space-y-3 border-t border-line pt-6">
        {state.error ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {state.error}
          </p>
        ) : null}
        {showSaved ? (
          <p role="status" className="text-sm font-semibold text-brand">
            Tersimpan.
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
