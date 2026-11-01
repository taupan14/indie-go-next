import { requireSuperAdmin } from "@/lib/admin";
import { Head, ui } from "@/components/AdminUI";

export default async function Audit() {
  const { sb } = await requireSuperAdmin();
  const { data } = await sb.from("audit_logs").select("id,actor_id,action,target,created_at").order("created_at", { ascending: false }).limit(100);
  const { data: actors } = await sb.from("author_public").select("id,username").in("id", [...new Set((data ?? []).map((r: any) => r.actor_id).filter(Boolean))]);
  const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title="Audit log" tab="sistem" />
      <div className="space-y-1">
        {(data ?? []).map((r: any) => (
          <div key={r.id} className={`${ui.card} flex flex-wrap items-center justify-between gap-2 text-sm`}>
            <span><span className="font-medium">{r.action}</span> <span className="text-muted">· {r.target}</span></span>
            <span className="text-xs text-muted">{actors?.find((a: any) => a.id === r.actor_id)?.username ?? "sistem"} · {fmt.format(new Date(r.created_at))}</span>
          </div>
        ))}
        {!data?.length && <p className="py-8 text-center text-sm text-muted">Belum ada catatan.</p>}
      </div>
      <p className="mt-3 text-xs text-muted">Menampilkan 100 catatan terbaru.</p>
    </main>
  );
}
