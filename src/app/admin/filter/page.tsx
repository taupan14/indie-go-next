import { requireSuperAdmin } from "@/lib/admin";
import { adminT } from "@/i18n/admin";
import ConfirmAction from "@/components/ConfirmAction";
import { Head, Flash, ui } from "@/components/AdminUI";
import { addTerm, deleteTerm } from "./actions";

export default async function Filter({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const tt = await adminT();
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb
    .from("filter_terms")
    .select("id,kind,term")
    .order("kind")
    .order("term");
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title={tt("Filter konten")} tab="konten" />
      <Flash
        ok={ok}
        error={error}
        map={{
          dup: tt("Sudah ada di daftar."),
          invalid: tt("Isian tidak valid (2-60 karakter)."),
        }}
      />
      <form action={addTerm} className={`${ui.card} mb-4 flex flex-wrap gap-2`}>
        <select name="kind" className={ui.input}>
          <option value="word">{tt("Kata atau frasa")}</option>
          <option value="domain">{tt("Domain")}</option>
        </select>
        <input
          name="term"
          required
          placeholder={tt("mis. kata terlarang atau situs-judi.com")}
          className={`${ui.input} min-w-0 flex-1`}
        />
        <button className={ui.btn}>{tt("Tambah")}</button>
      </form>
      <p className="mb-3 text-xs text-muted">
        {tt(
          "Daftar bawaan (kata kasar, judi, narkoba, pornografi, perdagangan manusia) sudah aktif di kode. Daftar ini menambahkannya. Perubahan berlaku dalam sekitar 1 menit. Kata dicocokkan sebagai kata utuh, domain termasuk subdomainnya.",
        )}
      </p>
      <div className="space-y-1">
        {(data ?? []).map((t: any) => (
          <div
            key={t.id}
            className={`${ui.card} flex items-center justify-between`}
          >
            <span className="text-sm">
              <span className="mr-2 rounded-full bg-accent px-2 py-0.5 text-xs">
                {t.kind === "word" ? tt("kata") : tt("domain")}
              </span>
              {t.term}
            </span>
            <ConfirmAction
              action={deleteTerm}
              fields={{ id: t.id }}
              label={tt("Hapus")}
              title={tt("Hapus dari filter?")}
              message="Kata atau domain ini tidak lagi difilter."
              confirm="Ya, hapus"
              className={ui.ghost}
            />
          </div>
        ))}
        {!data?.length && (
          <p className="py-6 text-center text-sm text-muted">
            {tt("Belum ada tambahan.")}
          </p>
        )}
      </div>
    </main>
  );
}
