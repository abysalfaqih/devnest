import type { AppSummary } from "../types";
import { AppRow } from "./app-row";

export function AppList({ apps }: { apps: AppSummary[] }) {
  return (
    <ul className="grid gap-x-12 border-b border-line md:grid-cols-2">
      {apps.map((app) => (
        <AppRow key={app.id} app={app} />
      ))}
    </ul>
  );
}
