import { headers } from "next/headers";

/** Alamat situs untuk tautan di email dan redirect login. Prioritas: NEXT_PUBLIC_SITE_URL, lalu origin request.
 *  Wajib mengisi NEXT_PUBLIC_SITE_URL di produksi agar tautan email tidak mengarah ke localhost. */
export async function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (env) return env;
  const h = await headers();
  return h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;
}
