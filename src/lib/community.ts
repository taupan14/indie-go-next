const TINTS = ["#F0B9A8", "#B7D9C4", "#C9CDEA", "#EBD79A", "#D8BFA9", "#E7B9C9"];
/** Warna tetap per komunitas (dipakai jika belum ada logo/banner). */
export const tint = (slug: string) => TINTS[[...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
export const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
