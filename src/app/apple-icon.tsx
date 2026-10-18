import { ImageResponse } from "next/og";
import { LOGO_COLORS, LOGO_DOT, LOGO_PATH } from "@/components/layout/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ikon layar utama iPhone/iPad. Kotak penuh, sudut dibulatkan oleh iOS sendiri. */
export default function AppleIcon() {
  return new ImageResponse(
    <svg width="180" height="180" viewBox="0 0 100 100">
      <rect width="100" height="100" fill={LOGO_COLORS.tile} />
      <g transform="translate(50 50) scale(1.1) translate(-50 -50)">
        <path d={LOGO_PATH} fill={LOGO_COLORS.letter} fillRule="evenodd" />
        <circle cx={LOGO_DOT.cx} cy={LOGO_DOT.cy} r={LOGO_DOT.r} fill={LOGO_COLORS.dot} />
      </g>
    </svg>,
    { ...size },
  );
}
