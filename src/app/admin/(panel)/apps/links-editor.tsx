"use client";

import { Field } from "@/components/ui/field";
import { limits } from "@/config/limits";

export type LinkValue = { key: string; label: string; url: string };

type LinksEditorProps = {
  links: LinkValue[];
  onChange: (links: LinkValue[]) => void;
  errors: Record<string, string>;
};

export function LinksEditor({ links, onChange, errors }: LinksEditorProps) {
  const max = limits.app.downloadLinks;

  function update(index: number, patch: Partial<LinkValue>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  return (
    <div>
      <ul className="space-y-4">
        {links.map((link, index) => (
          <li key={link.key} className="rounded-2xl border border-line p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Tombol {index + 1}</p>
              <button
                type="button"
                onClick={() => onChange(links.filter((_, i) => i !== index))}
                aria-label={`Hapus tombol ${index + 1}`}
                className="inline-flex min-h-10 items-center px-2 text-sm text-muted underline underline-offset-4"
              >
                Hapus
              </button>
            </div>
            <div className="mt-2 grid gap-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <Field
                id={`link-${index}-label`}
                label="Nama tombol"
                value={link.label}
                onChange={(event) => update(index, { label: event.target.value })}
                maxLength={limits.downloadLink.label}
                autoComplete="off"
                error={errors[`links.${index}.label`]}
              />
              <Field
                id={`link-${index}-url`}
                label="Link unduhan"
                value={link.url}
                onChange={(event) => update(index, { url: event.target.value })}
                inputMode="url"
                autoComplete="off"
                placeholder="https://..."
                error={errors[`links.${index}.url`]}
              />
            </div>
          </li>
        ))}
      </ul>

      {errors.links ? (
        <p className="mt-3 text-sm font-semibold text-danger">{errors.links}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={links.length >= max}
          onClick={() =>
            onChange([...links, { key: crypto.randomUUID(), label: "Unduh", url: "" }])
          }
          className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-on-brand disabled:pointer-events-none disabled:opacity-50"
        >
          + Tambah tombol
        </button>
        <p className="text-sm text-muted">
          {links.length} dari {max} tombol. Pengunjung tidak melihat link ini langsung; mereka
          melewati verifikasi dulu.
        </p>
      </div>
    </div>
  );
}
