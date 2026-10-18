import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-signal text-on-signal hover:brightness-95 active:brightness-90",
  secondary: "border border-brand text-brand hover:bg-brand hover:text-on-brand",
  ghost: "text-ink hover:bg-surface",
} as const;

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
