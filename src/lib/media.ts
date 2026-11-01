export type Media = { type: "image" | "youtube" | "link"; url: string };

/** Hanya izinkan http(s). Mencegah URL berbahaya seperti javascript: */
export function safeUrl(u: string): string | null {
  try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : null; } catch { return null; }
}

export function youtubeId(u: string): string | null {
  return u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] ?? null;
}
