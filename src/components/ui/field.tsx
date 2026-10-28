import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type BaseProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

const control = "mt-1.5 w-full rounded-xl bg-surface px-4 text-base";

function borderClass(error?: string) {
  return error ? "border-2 border-danger" : "border border-muted";
}

function describedBy(id: string, hint?: string, error?: string) {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function Notes({ id, hint, error }: Pick<BaseProps, "id" | "hint" | "error">) {
  return (
    <>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </>
  );
}

/** Kolom isian dengan label. Batas kolom memakai warna muted agar kontrasnya cukup (3:1). */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: BaseProps & ComponentProps<"input">) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        className={cn(control, "h-12", borderClass(error), className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      <Notes id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextareaField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: BaseProps & ComponentProps<"textarea">) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        className={cn(control, "py-3", borderClass(error), className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      <Notes id={id} hint={hint} error={error} />
    </div>
  );
}
