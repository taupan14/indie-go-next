import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin";
import { createCommunity } from "./actions";

const MSG: Record<string, string> = {
  invalid: "Isian tidak valid. Nama minimal 3 karakter dan email harus benar.",
  slug: "Alamat (slug) sudah dipakai komunitas lain.",
  curation: "Nama atau deskripsi mengandung konten yang dilarang.",
  invite: "Undangan gagal dikirim. Periksa email dan pengaturan email Supabase.",
};
const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export default async function KomunitasAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data: list } = await sb.from("communities").select("id,slug,name,member_count,thread_count,admin_id").order("created_at", { ascending: false });
  const { data: admins } = await sb.from("author_public").select("id,username").in("id", (list ?? []).map((c: any) => c.admin_id));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/admin?tab=konten" className="text-xs text-muted">← Panel admin</Link>
      <h1 className="mb-4 mt-1 text-xl font-medium">Komunitas</h1>
      {ok && <p role="status" className="mb-3 rounded-lg border border-border bg-accent px-3 py-2 text-sm">Komunitas dibuat. Jika email belum terdaftar, undangan sudah dikirim.</p>}
      {error && <p role="alert" className="mb-3 rounded-lg border border-danger bg-accent px-3 py-2 text-sm text-danger">{MSG[error] ?? MSG.invalid}</p>}

      <form action={createCommunity} className="mb-6 space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-medium">Buat komunitas baru</h2>
        <input name="name" required minLength={3} maxLength={60} placeholder="Nama komunitas" className={input} />
        <input name="slug" pattern="[a-z0-9-]{3,40}" placeholder="Alamat (opsional, mis. komunitas-desainer)" className={input} />
        <textarea name="description" rows={2} maxLength={300} placeholder="Deskripsi singkat" className={input} />
        <input name="email" type="email" required placeholder="Email admin komunitas" className={input} />
        <p className="text-xs text-muted">Jika email sudah terdaftar, pemiliknya langsung menjadi admin. Jika belum, undangan dikirim agar ia membuat kata sandi sendiri. Satu komunitas hanya punya satu admin.</p>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Buat komunitas</button>
      </form>

      <div className="space-y-2">
        {(list ?? []).map((c: any) => (
          <Link key={c.id} href={`/komunitas/${c.slug}`} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm hover:bg-accent">
            <span><span className="font-medium">{c.name}</span><span className="block text-xs text-muted">admin: {admins?.find((a: any) => a.id === c.admin_id)?.username ?? "?"}</span></span>
            <span className="text-xs text-muted">{c.member_count} anggota · {c.thread_count} thread</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
