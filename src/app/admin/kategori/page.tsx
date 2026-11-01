import { requireSuperAdmin } from "@/lib/admin";
import { Head, Flash, ui } from "@/components/AdminUI";
import { saveCategory, deleteCategory } from "./actions";

const MAP = { invalid: "Nama 2-30 karakter dan warna harus valid.", dup: "Nama kategori sudah ada.", used: "Kategori masih dipakai thread. Pindahkan thread-nya dulu." };

export default async function Kategori({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb.from("categories").select("*").order("sort");
  const Row = ({ c }: { c?: any }) => (
    <form action={saveCategory} className={`${ui.card} flex flex-wrap items-center gap-2`}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <input name="name" required minLength={2} maxLength={30} defaultValue={c?.name} placeholder="Nama kategori" className={`${ui.input} min-w-0 flex-1`} />
      <input name="color" type="color" defaultValue={c?.color ?? "#A80000"} aria-label="Warna" className="h-8 w-10 rounded border border-border bg-surface" />
      <input name="sort" type="number" min={0} max={999} defaultValue={c?.sort ?? 0} aria-label="Urutan" className={`${ui.input} w-20`} />
      <button className={ui.btn}>{c ? "Simpan" : "Tambah"}</button>
      {c && <button formAction={deleteCategory} formNoValidate className={ui.ghost}>Hapus</button>}
    </form>
  );
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title="Kategori" tab="konten" />
      <Flash ok={ok} error={error} map={MAP} />
      <div className="space-y-2">{(data ?? []).map((c: any) => <Row key={c.id} c={c} />)}<Row /></div>
    </main>
  );
}
