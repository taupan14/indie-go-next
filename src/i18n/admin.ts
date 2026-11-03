import { getLocale } from "@/i18n";
import { EN } from "./admin-en";

/** Penerjemah untuk halaman admin dan dialog: kunci = teks Indonesia, nilai = terjemahan Inggris.
 *  Teks yang belum ada di kamus tampil apa adanya. `tt.en` menandai bahasa Inggris aktif (untuk komponen client). */
export async function adminT() {
  const en = (await getLocale()) === "en";
  return Object.assign((s: string) => (en ? (EN[s] ?? s) : s), { en });
}
