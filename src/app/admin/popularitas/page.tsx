import { requireSuperAdmin } from "@/lib/admin";
import { Head, Flash, ui } from "@/components/AdminUI";
import { savePopularity } from "./actions";

export default async function Popularitas({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb.from("app_settings").select("value").eq("key", "popularity").maybeSingle();
  const w = data?.value?.weights ?? { vote: 1, comment: 2, share: 3 };
  const l = data?.value?.levels ?? { active: 50, popular: 150, figure: 300 };
  const F = ({ name, label, v }: { name: string; label: string; v: number }) => (
    <label className="text-sm">{label}<input name={name} type="number" min={0} max={1000} required defaultValue={v} className={`${ui.input} mt-1 w-full`} /></label>
  );
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <Head title="Popularitas" tab="sistem" />
      <Flash ok={ok} error={error} map={{ invalid: "Semua angka 0-1000, dan ambang level harus naik: Aktif < Populer < Tokoh." }} />
      <form action={savePopularity} className="space-y-5">
        <div className={ui.card}><h2 className="mb-2 text-sm font-medium">Bobot poin</h2>
          <div className="grid gap-3 sm:grid-cols-3"><F name="vote" label="Per upvote" v={w.vote} /><F name="comment" label="Per komentator unik" v={w.comment} /><F name="share" label="Per share" v={w.share} /></div></div>
        <div className={ui.card}><h2 className="mb-2 text-sm font-medium">Ambang level (poin)</h2>
          <div className="grid gap-3 sm:grid-cols-3"><F name="active" label="Aktif" v={l.active} /><F name="popular" label="Populer" v={l.popular} /><F name="figure" label="Tokoh" v={l.figure} /></div></div>
        <button className={ui.btn}>Simpan</button>
        <p className="text-xs text-muted">Poin dihitung ulang saat profil dibuka, jadi perubahan berlaku langsung. Aksi diri sendiri, akun tidak aktif, dan konten tersembunyi tidak dihitung.</p>
      </form>
    </main>
  );
}
