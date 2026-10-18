"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import type { AdBanner } from "../types";

const AUTOPLAY_MS = 6000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const getServerReducedMotion = () => false;

const tones = {
  moss: { panel: "bg-moss text-lichen", orb: "bg-marigold" },
  marigold: { panel: "bg-marigold text-peat", orb: "bg-moss" },
  ink: { panel: "bg-peat text-lichen", orb: "bg-marigold" },
} as const;

function FallbackPanel({ banner }: { banner: AdBanner }) {
  const tone = tones[banner.tone ?? "moss"];
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-center gap-[1.4cqw] overflow-hidden px-[6cqw]",
        tone.panel,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute -right-[7cqw] -bottom-[18cqw] size-[46cqw] rounded-full", tone.orb)}
      />
      <p className="relative max-w-[62%] font-display text-[clamp(1.25rem,6.4cqw,4.5rem)] leading-[1.02] font-bold tracking-tight text-balance">
        {banner.title}
      </p>
      {banner.subtitle ? (
        <p className="relative hidden max-w-[55%] text-[max(0.8125rem,2.1cqw)] leading-snug opacity-90 @md:block">
          {banner.subtitle}
        </p>
      ) : null}
    </div>
  );
}

function BannerSlide({ banner, preload }: { banner: AdBanner; preload: boolean }) {
  const isExternal = /^https?:\/\//i.test(banner.href);
  const linkClass =
    "absolute inset-0 block focus-visible:outline-none after:pointer-events-none after:absolute after:inset-0 focus-visible:after:shadow-[inset_0_0_0_6px_var(--color-peat),inset_0_0_0_9px_var(--color-lichen)]";

  const inner = (
    <>
      {banner.imageUrl ? (
        <Image
          src={banner.imageUrl}
          alt={banner.imageAlt}
          fill
          sizes="(min-width: 1152px) 1088px, 100vw"
          preload={preload}
          className="object-cover"
        />
      ) : (
        <FallbackPanel banner={banner} />
      )}
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-peat/70 px-2.5 py-1 text-xs font-medium text-lichen">
        Iklan
      </span>
      {isExternal ? <span className="sr-only">(buka di tab baru)</span> : null}
    </>
  );

  return isExternal ? (
    <a href={banner.href} target="_blank" rel="sponsored noopener noreferrer" className={linkClass}>
      {inner}
    </a>
  ) : (
    <Link href={banner.href} className={linkClass}>
      {inner}
    </Link>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
      <rect x="3.5" y="3" width="3" height="10" rx="1" />
      <rect x="9.5" y="3" width="3" height="10" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
      <path d="M4.5 3.2v9.6a.8.8 0 0 0 1.2.7l7.7-4.8a.8.8 0 0 0 0-1.4L5.7 2.5a.8.8 0 0 0-1.2.7Z" />
    </svg>
  );
}

export function AdCarousel({ banners }: { banners: AdBanner[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusing, setFocusing] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  const count = banners.length;
  const autoplay = count > 1 && !userPaused && !hovering && !focusing && !reducedMotion;

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      track.scrollTo({ left: ((current + 1) % count) * track.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, count]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Promosi"
      className="relative overflow-hidden rounded-3xl"
    >
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={() => setUserPaused(true)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setFocusing(true)}
        onBlur={() => setFocusing(false)}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => (
          <li
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} dari ${count}`}
            inert={index !== active}
            className="@container relative aspect-[2/1] w-full shrink-0 snap-center lg:aspect-[5/2]"
          >
            <BannerSlide banner={banner} preload={index === 0} />
          </li>
        ))}
      </ul>

      {count > 1 ? (
        <div className="absolute right-3 bottom-3 flex items-center rounded-full bg-peat/70 text-lichen">
          {reducedMotion ? null : (
            <button
              type="button"
              onClick={() => setUserPaused((paused) => !paused)}
              aria-label={userPaused ? "Putar banner otomatis" : "Jeda banner otomatis"}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-lichen/15 focus-visible:outline-offset-[-2px] focus-visible:outline-lichen"
            >
              {userPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
          )}
          <div className={cn("flex items-center pr-2", reducedMotion && "pl-2")}>
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Tampilkan banner ${index + 1} dari ${count}`}
                aria-current={index === active}
                onClick={() => {
                  setUserPaused(true);
                  goTo(index);
                }}
                className="grid size-6 place-items-center rounded-full focus-visible:outline-offset-[-2px] focus-visible:outline-lichen"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === active ? "w-5 bg-marigold" : "w-2 bg-lichen/60",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
