import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";

type AuthLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Kerangka halaman login dan MFA: satu kolom di tengah layar. */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-12"
    >
      <LogoMark className="size-12 rounded-[22%] ring-1 ring-ink/15" />
      <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">{title}</h1>
      {description ? <p className="mt-2 text-muted">{description}</p> : null}
      <div className="mt-8">{children}</div>
    </main>
  );
}
