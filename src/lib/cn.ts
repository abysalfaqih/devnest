type ClassValue = string | false | null | undefined;

/** Menggabungkan class CSS, mengabaikan nilai kosong. */
export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}
