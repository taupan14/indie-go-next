import "server-only";
import { supabaseAdmin } from "./supabase/admin";

/** Daftar awal. Admin menambah kata/domain lewat tabel filter_terms (kolom kind: word | domain).
 *  Frasa dicocokkan sebagai kata utuh agar tidak salah tangkap (mis. "Scunthorpe problem"). */
const SEED: Record<string, string[]> = {
  swearing: ["anjing", "bangsat", "bajingan", "kontol", "memek", "kampret", "goblok", "tolol", "fuck", "shit", "bitch"],
  gambling: ["togel", "judol", "slot gacor", "judi online", "judi bola", "situs slot", "bandar togel"],
  drugs: ["jual sabu", "beli sabu", "jual narkoba", "jual ganja", "jual ekstasi"],
  porn: ["bokep", "video bokep", "bugil", "open bo"],
  trafficking: ["jual perempuan", "jual manusia", "jual gadis"],
};

const LEET: Record<string, string> = { "4": "a", "3": "e", "1": "i", "0": "o", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

/** Huruf kecil, hilangkan aksen, ubah k4mpr3t -> kampret, rapatkan huruf berulang. */
export function norm(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[43105 7@$!]/g, (c) => LEET[c] ?? " ")
    .replace(/[^a-z]+/g, " ").replace(/(.)\1+/g, "$1").trim();
}

let cache: { at: number; words: [string, string][]; domains: string[] } | null = null;
async function terms() {
  if (cache && Date.now() - cache.at < 60_000) return cache;
  const words: [string, string][] = Object.entries(SEED).flatMap(([cat, list]) => list.map((w) => [norm(w), cat] as [string, string]));
  const domains: string[] = [];
  try {
    const { data } = await supabaseAdmin().from("filter_terms").select("kind,term");
    for (const r of data ?? []) r.kind === "domain" ? domains.push(r.term.toLowerCase()) : words.push([norm(r.term), "custom"]);
  } catch { /* tanpa service role, pakai daftar awal saja */ }
  return (cache = { at: Date.now(), words, domains });
}

/** Mengembalikan kategori pelanggaran, atau null jika aman. */
export async function checkContent(texts: string[], urls: string[]): Promise<string | null> {
  const { words, domains } = await terms();
  const hay = ` ${norm(texts.join(" \n "))} `;
  for (const [w, cat] of words) if (w && hay.includes(` ${w} `)) return cat;
  for (const u of urls) {
    try {
      const host = new URL(u).hostname.toLowerCase();
      if (domains.some((d) => host === d || host.endsWith("." + d))) return "custom";
    } catch { /* URL tidak valid ditangani validator lain */ }
  }
  return null;
}

/** Pemindai gambar (nudity, kekerasan/darah). BELUM AKTIF: sambungkan ke penyedia moderasi gambar
 *  yang dipilih. Kembalikan kategori ("porn" | "violence") jika terblokir, atau null jika aman. */
export async function scanImage(_file: ArrayBuffer): Promise<string | null> {
  return null;
}
