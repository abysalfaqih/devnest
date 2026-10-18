/** Tanda merek Devnest: telur di dalam sarang. Warna tetap di semua tema. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="#1d4a33" />
      <path
        d="M8 17c1.5 5.5 14.5 5.5 16 0"
        fill="none"
        stroke="#ebf0e6"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="12.5" r="3.6" fill="#f2b21f" />
    </svg>
  );
}
