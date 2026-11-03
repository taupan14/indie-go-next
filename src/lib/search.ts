export const PAGE = 20;
export const cleanQuery = (q?: string) =>
  (q ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
/** Kata untuk penyorotan judul (maks. 6, tanpa tanda kutip). */
export const termsOf = (q: string) =>
  [
    ...new Set(
      q
        .replace(/"/g, " ")
        .split(" ")
        .filter((w) => w.length > 1),
    ),
  ].slice(0, 6);
export const SORTS = ["relevan", "terbaru", "populer"] as const;
export const pickSort = (v: string | undefined, searching: boolean) =>
  (SORTS as readonly string[]).includes(v ?? "")
    ? (v as string)
    : searching
      ? "relevan"
      : "terbaru";
/** Susun URL dengan parameter yang tidak kosong. */
export function buildHref(
  base: string,
  params: Record<string, string | undefined>,
) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}
