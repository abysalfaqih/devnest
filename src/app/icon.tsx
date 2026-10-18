import { ImageResponse } from "next/og";
import { LOGO_COLORS, LOGO_DOT, LOGO_PATH } from "@/components/layout/logo";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Favicon. Huruf diperbesar sedikit supaya tetap terbaca di ukuran 16 px. */
export default function Icon() {
  return new ImageResponse(
    <svg width="512" height="512" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="22" fill={LOGO_COLORS.tile} />
      <g transform="translate(50 50) scale(1.14) translate(-50 -50)">
        <path d={LOGO_PATH} fill={LOGO_COLORS.letter} fillRule="evenodd" />
        <circle cx={LOGO_DOT.cx} cy={LOGO_DOT.cy} r={LOGO_DOT.r} fill={LOGO_COLORS.dot} />
      </g>
    </svg>,
    { ...size },
  );
}
