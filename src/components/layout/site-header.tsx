import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { LogoMark } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={`${siteConfig.name}, ke beranda`}
          className="flex items-center gap-2.5"
        >
          <LogoMark className="size-8" />
          <span className="font-display text-xl font-bold tracking-tight">{siteConfig.name}</span>
        </Link>

        <nav aria-label="Utama">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-2.5 text-[0.9rem] text-muted transition-colors hover:bg-surface hover:text-ink sm:px-4 sm:text-[0.95rem]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
