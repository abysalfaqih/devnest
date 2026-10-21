import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";
import { logoutAction } from "@/server/auth/actions";
import { AdminNav } from "./admin-nav";

type AdminShellProps = {
  email: string;
  children: ReactNode;
};

const signOutClass =
  "inline-flex min-h-10 items-center rounded-full px-4 text-[0.95rem] text-muted transition-colors hover:bg-surface hover:text-ink";

/** Kerangka panel admin: menu di atas (mobile) atau di kiri (desktop). */
export function AdminShell({ email, children }: AdminShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-line lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20 lg:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="size-8 rounded-[22%] ring-1 ring-ink/15" />
            <span className="font-display text-lg font-bold tracking-tight">Admin</span>
          </Link>
          <form action={logoutAction} className="lg:hidden">
            <button type="submit" className={signOutClass}>
              Keluar
            </button>
          </form>
        </div>

        <AdminNav />

        <div className="mt-auto hidden border-t border-line p-4 lg:block">
          <p className="truncate px-2 text-sm text-muted" title={email}>
            {email}
          </p>
          <form action={logoutAction} className="mt-2">
            <button type="submit" className={`${signOutClass} w-full`}>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
