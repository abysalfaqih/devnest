export function StatusBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-on-brand">
        Terbit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-muted px-2.5 py-0.5 text-xs font-semibold text-muted">
      Draf
    </span>
  );
}
