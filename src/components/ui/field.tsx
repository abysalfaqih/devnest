import type { ComponentProps } from "react";

type FieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  hint?: string;
};

/** Kolom isian dengan label. Batas kolom memakai warna muted agar kontrasnya cukup (3:1). */
export function Field({ id, label, hint, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        className="mt-1.5 h-12 w-full rounded-xl border border-muted bg-surface px-4 text-base"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
