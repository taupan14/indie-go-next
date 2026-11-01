import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin";
import { Head, ui } from "@/components/AdminUI";
import { setStatus } from "./actions";

const LABEL: Record<string, string> = { active: "Aktif", suspended: "Disuspend", banned: "Diblokir" };

export default async function Pengguna({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb, user } = await requireSuperAdmin();
  const { q } = await searchParams;
  let query = sb.from("profiles").select("id,username,role,status,created_at").order("created_at", { ascending: false }).limit(30);
  if (q) query = query.ilike("username", `%${q.replace(/[%_\\]/g, "")}%`);
  const { data } = await query;
  const Btn = ({ id, status, label }: { id: string; status: string; label: string }) => (
    <form action={setStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><button className={ui.ghost}>{label}</button></form>
  );
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title="Pengguna" tab="pengguna" />
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Cari username" className={`${ui.input} flex-1`} /><button className={ui.btn}>Cari</button></form>
      <div className="space-y-2">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className={`${ui.card} flex flex-wrap items-center gap-3`}>
            <span className="min-w-0 flex-1"><Link href={`/u/${p.username}`} className="font-medium hover:underline">{p.username}</Link>
              <span className="block text-xs text-muted">{p.role === "super_admin" ? "Super admin" : "Pengguna"} · {LABEL[p.status]} · {new Date(p.created_at).toLocaleDateString("id-ID")}</span></span>
            {p.role === "user" && p.id !== user.id && (
              <div className="flex gap-2">
                {p.status !== "active" && <Btn id={p.id} status="active" label="Aktifkan" />}
                {p.status === "active" && <Btn id={p.id} status="suspended" label="Suspend" />}
                {p.status !== "banned" && <Btn id={p.id} status="banned" label="Blokir" />}
              </div>
            )}
          </div>
        ))}
        {!data?.length && <p className="py-8 text-center text-sm text-muted">Tidak ditemukan.</p>}
      </div>
      <p className="mt-4 text-xs text-muted">Akun disuspend atau diblokir tidak bisa memposting, berkomentar, memberi suara, atau melapor. Konten lamanya tetap tampil sampai disembunyikan lewat Laporan.</p>
    </main>
  );
}
