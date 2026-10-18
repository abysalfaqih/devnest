import { cacheLife } from "next/cache";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

/** Tahun diambil sekali lalu di-cache, supaya halaman tetap statis. */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold tracking-tight">{siteConfig.name}</p>
          <p className="mt-1 max-w-xs text-sm text-muted">{siteConfig.description}</p>
        </div>

        <nav aria-label="Informasi legal">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {siteConfig.legal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-8 items-center text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Container className="pb-10 text-sm text-muted">
        <p>
          © <CurrentYear /> {siteConfig.name}. Semua hak dilindungi.
        </p>
      </Container>
    </footer>
  );
}
