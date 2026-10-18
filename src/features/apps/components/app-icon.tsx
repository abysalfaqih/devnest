import Image from "next/image";
import { cn } from "@/lib/cn";

/** Warna cadangan untuk aplikasi tanpa logo. Dipilih tetap berdasarkan nama. */
const fallbackTones = [
  { background: "#1d4a33", color: "#ebf0e6" },
  { background: "#f2b21f", color: "#15251c" },
  { background: "#175b63", color: "#ebf0e6" },
  { background: "#3d5a73", color: "#ebf0e6" },
];

function pickTone(name: string) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return fallbackTones[sum % fallbackTones.length];
}

type AppIconProps = {
  name: string;
  iconUrl: string | null;
  className?: string;
};

export function AppIcon({ name, iconUrl, className }: AppIconProps) {
  const shape = "relative block overflow-hidden rounded-[22%] ring-1 ring-inset ring-ink/15";

  if (iconUrl) {
    return (
      <span className={cn(shape, className)}>
        <Image src={iconUrl} alt="" fill sizes="96px" className="object-cover" />
      </span>
    );
  }

  const tone = pickTone(name);
  return (
    <span
      aria-hidden="true"
      className={cn(shape, "@container grid place-items-center select-none", className)}
      style={tone}
    >
      <span className="font-display text-[42cqw] leading-none font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}
