import Link from "next/link";
import type { AppSummary } from "../types";
import { AppIcon } from "./app-icon";

export function AppTile({ app }: { app: AppSummary }) {
  return (
    <li>
      <Link
        href={`/apps/${app.slug}`}
        className="block h-full rounded-2xl p-2 transition-colors hover:bg-surface"
      >
        <AppIcon
          name={app.name}
          iconUrl={app.iconUrl}
          className="aspect-square w-full max-w-28 lg:max-w-36"
        />
        <span className="mt-3 line-clamp-2 block font-display text-[0.95rem] leading-snug font-semibold tracking-tight lg:text-base">
          {app.name}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-2 text-[0.78rem] text-muted tabular-nums">
          <span>{app.size}</span>
          <span>v{app.version}</span>
        </span>
      </Link>
    </li>
  );
}
