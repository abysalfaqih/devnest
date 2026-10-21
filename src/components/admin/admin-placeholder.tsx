type AdminPlaceholderProps = {
  title: string;
  phase: string;
};

/** Halaman sementara untuk menu yang dibangun di fase berikutnya. */
export function AdminPlaceholder({ title, phase }: AdminPlaceholderProps) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-prose text-muted">Halaman ini dibangun di {phase}.</p>
    </>
  );
}
