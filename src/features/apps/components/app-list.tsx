import type { AppSummary } from "../types";
import { AppTile } from "./app-tile";

export function AppList({ apps }: { apps: AppSummary[] }) {
  return (
    <ul className="-mx-2 grid grid-cols-3 gap-y-1 md:grid-cols-6">
      {apps.map((app) => (
        <AppTile key={app.id} app={app} />
      ))}
    </ul>
  );
}
