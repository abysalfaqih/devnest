"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/apps", label: "Aplikasi", exact: false },
  { href: "/admin/ads", label: "Iklan", exact: false },
  { href: "/admin/legal", label: "Halaman legal", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu admin" className="overflow-x-auto px-3 pb-3 lg:px-4 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 w-full items-center rounded-full px-3 text-[0.95rem] transition-colors lg:rounded-xl lg:px-4",
                  active
                    ? "bg-brand font-semibold text-on-brand"
                    : "text-muted hover:bg-surface hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
