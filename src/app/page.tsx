import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { AdCarousel } from "@/features/ads/components/ad-carousel";
import { sampleBanners } from "@/features/ads/sample-data";
import { AppList } from "@/features/apps/components/app-list";
import { sampleApps } from "@/features/apps/sample-data";

export default function HomePage() {
  const apps = sampleApps.slice(0, siteConfig.homeAppLimit);
  const hasMore = sampleApps.length > siteConfig.homeAppLimit;

  return (
    <>
      <h1 className="sr-only">Devnest: unduh aplikasi buatan sendiri</h1>

      <section aria-label="Promosi" className="pt-6 sm:pt-8">
        <Container>
          <AdCarousel banners={sampleBanners} />
        </Container>
      </section>

      <section aria-labelledby="apps-heading" className="pt-12 sm:pt-16">
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <h2
              id="apps-heading"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Aplikasi terbaru
            </h2>
            <p className="text-muted">Semua dibuat dan dirawat sendiri.</p>
          </div>

          <AppList apps={apps} />

          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/apps" variant="secondary">
                Lihat semua aplikasi ({sampleApps.length})
              </ButtonLink>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
