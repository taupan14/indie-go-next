import { requireSuperAdmin } from "@/lib/admin";
import { Head, Flash, ui } from "@/components/AdminUI";
import { addTerm, deleteTerm } from "./actions";

export default async function Filter({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb.from("filter_terms").select("id,kind,term").order("kind").order("term");
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title="Filter konten" tab="konten" />
      <Flash ok={ok} error={error} map={{ dup: "Sudah ada di daftar.", invalid: "Isian tidak valid (2-60 karakter)." }} />
      <form action={addTerm} className={`${ui.card} mb-4 flex flex-wrap gap-2`}>
        <select name="kind" className={ui.input}><option value="word">Kata atau frasa</option><option value="domain">Domain</option></select>
        <input name="term" required placeholder="mis. kata terlarang atau situs-judi.com" className={`${ui.input} min-w-0 flex-1`} />
        <button className={ui.btn}>Tambah</button>
      </form>
      <p className="mb-3 text-xs text-muted">Daftar bawaan (kata kasar, judi, narkoba, pornografi, perdagangan manusia) sudah aktif di kode. Daftar ini menambahkannya. Perubahan berlaku dalam sekitar 1 menit. Kata dicocokkan sebagai kata utuh, domain termasuk subdomainnya.</p>
      <div className="space-y-1">
        {(data ?? []).map((t: any) => (
          <form key={t.id} action={deleteTerm} className={`${ui.card} flex items-center justify-between`}>
            <input type="hidden" name="id" value={t.id} />
            <span className="text-sm"><span className="mr-2 rounded-full bg-accent px-2 py-0.5 text-xs">{t.kind === "word" ? "kata" : "domain"}</span>{t.term}</span>
            <button className={ui.ghost}>Hapus</button>
          </form>
        ))}
        {!data?.length && <p className="py-6 text-center text-sm text-muted">Belum ada tambahan.</p>}
      </div>
    </main>
  );
}
