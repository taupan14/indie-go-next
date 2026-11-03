import { requireSuperAdmin } from "@/lib/admin";
import { adminT } from "@/i18n/admin";
import ConfirmAction from "@/components/ConfirmAction";
import { Head, Flash, ui } from "@/components/AdminUI";
import { saveCategory, deleteCategory } from "./actions";

const MAP = {
  invalid: "Nama 2-30 karakter dan warna harus valid.",
  dup: "Nama kategori sudah ada.",
  used: "Kategori masih dipakai thread. Pindahkan thread-nya dulu.",
};

export default async function Kategori({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const tt = await adminT();
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb.from("categories").select("*").order("sort");
  const Row = ({ c }: { c?: any }) => (
    <div className={`${ui.card} flex flex-wrap items-center gap-2`}>
      <form
        action={saveCategory}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      >
        {c && <input type="hidden" name="id" value={c.id} />}
        <input
          name="name"
          required
          minLength={2}
          maxLength={30}
          defaultValue={c?.name}
          placeholder={tt("Nama kategori")}
          className={`${ui.input} min-w-0 flex-1`}
        />
        <input
          name="color"
          type="color"
          defaultValue={c?.color ?? "#A80000"}
          aria-label={tt("Warna")}
          className="h-8 w-10 rounded border border-border bg-surface"
        />
        <input
          name="sort"
          type="number"
          min={0}
          max={999}
          defaultValue={c?.sort ?? 0}
          aria-label={tt("Urutan")}
          className={`${ui.input} w-20`}
        />
        <button className={ui.btn}>{c ? tt("Simpan") : tt("Tambah")}</button>
      </form>
      {c && (
        <ConfirmAction
          action={deleteCategory}
          fields={{ id: c.id }}
          label={tt("Hapus")}
          title={tt("Hapus kategori?")}
          message="Kategori ini akan dihapus permanen. Kategori yang masih dipakai thread tidak bisa dihapus."
          confirm="Ya, hapus"
        />
      )}
    </div>
  );
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title={tt("Kategori")} tab="konten" />
      <Flash ok={ok} error={error} map={MAP} />
      <div className="space-y-2">
        {(data ?? []).map((c: any) => (
          <Row key={c.id} c={c} />
        ))}
        <Row />
      </div>
    </main>
  );
}
