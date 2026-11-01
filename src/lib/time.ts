import type { Locale } from "@/i18n";
const UNIT = { id: { m: "m", h: "j", d: "h" }, en: { m: "m", h: "h", d: "d" } } as const;
export function ago(iso: string, l: Locale) {
  const m = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return m + UNIT[l].m;
  if (m < 1440) return Math.floor(m / 60) + UNIT[l].h;
  return Math.floor(m / 1440) + UNIT[l].d;
}
