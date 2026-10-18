import Link from "next/link";
import type { AppSummary } from "../types";
import { AppIcon } from "./app-icon";

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="m7.5 4.5 5.5 5.5-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppRow({ app }: { app: AppSummary }) {
  return (
    <li className="border-t border-line">
      <Link
        href={`/apps/${app.slug}`}
        className="-mx-3 flex items-start gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-surface sm:gap-5"
      >
        <AppIcon
          name={app.name}
          iconUrl={app.iconUrl}
          className="size-16 shrink-0 sm:size-[4.5rem]"
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-semibold tracking-tight">
            {app.name}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[0.9rem] leading-snug text-muted">
            {app.summary}
          </span>
          <span className="mt-1.5 flex gap-4 text-[0.8rem] text-muted tabular-nums">
            <span>Versi {app.version}</span>
            <span>{app.size}</span>
          </span>
        </span>

        <Chevron className="size-5 shrink-0 self-center text-muted" />
      </Link>
    </li>
  );
}
