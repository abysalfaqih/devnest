import { Field } from "@/components/ui/field";

/** Kolom 6 digit untuk kode authenticator. */
export function CodeField() {
  return (
    <Field
      id="code"
      name="code"
      label="Kode 6 digit"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      minLength={6}
      maxLength={6}
      required
      className="mt-1.5 h-12 w-full rounded-xl border border-muted bg-surface px-4 text-center font-mono text-xl tracking-[0.4em]"
    />
  );
}
