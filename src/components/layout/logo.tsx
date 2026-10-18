/**
 * Logo Devnest: huruf "d" dengan titik hijau. Dilacak dari logo asli (JPG)
 * menjadi vektor pada kotak 100x100. Warnanya tetap di semua tema.
 */
export const LOGO_PATH =
  "M46.79 79.08C30.73 77.91 21.37 59.94 29.38 45.66C36.16 33.59 51.96 30.6 60.66 39.73C61.18 40.29 61.33 40.37 61.43 40.17C61.44 40.14 61.47 37.2 61.48 33.64C61.5 26.51 61.48 27.01 61.72 26.51C61.87 26.21 62.42 25.67 62.89 25.37C63.09 25.24 63.68 24.86 64.2 24.52C66.15 23.26 66.65 22.93 67.38 22.46C67.79 22.19 68.37 21.81 68.68 21.61C69.49 21.08 69.63 21.04 69.75 21.26C69.8 21.36 69.8 57.6 69.74 58.38C68.91 70.63 58.58 79.95 46.79 79.08ZM49.62 70.84C59.2 69.81 64.56 59.15 60.09 50.02C55.52 40.67 42.15 40.09 36.84 49.01C30.75 59.24 38.26 72.06 49.62 70.84Z";

export const LOGO_DOT = { cx: 69.74, cy: 75.3, r: 3.75 } as const;

export const LOGO_COLORS = {
  tile: "#141414",
  letter: "#ffffff",
  dot: "#01ea75",
} as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <rect width="100" height="100" rx="22" fill={LOGO_COLORS.tile} />
      <path d={LOGO_PATH} fill={LOGO_COLORS.letter} fillRule="evenodd" />
      <circle cx={LOGO_DOT.cx} cy={LOGO_DOT.cy} r={LOGO_DOT.r} fill={LOGO_COLORS.dot} />
    </svg>
  );
}
