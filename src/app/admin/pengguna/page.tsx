import Link from "next/link";
import { adminT } from "@/i18n/admin";
import ConfirmAction from "@/components/ConfirmAction";
import { requireSuperAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Head, Flash, ui } from "@/components/AdminUI";
import DeleteUserDialog from "@/components/DeleteUserDialog";
import { setStatus } from "./actions";

const MAP = {
  invalid: "Permintaan tidak valid.",
  self: "Anda tidak bisa menghapus akun Anda sendiri.",
  forbidden: "Akun super admin tidak bisa dihapus dari sini.",
  password: "Kata sandi salah.",
  confirm: "Username konfirmasi tidak cocok.",
  admin:
    "Pengguna ini admin sebuah komunitas. Alihkan admin komunitasnya lebih dulu (Kelola komunitas).",
  failed: "Gagal menghapus akun. Coba lagi.",
};

export default async function Pengguna({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const tt = await adminT();
  const { user } = await requireSuperAdmin();
  const { q, ok, error } = await searchParams;
  const needsPassword = (user.app_metadata?.providers ?? []).includes("email");
  const { data } = await supabaseAdmin().rpc("admin_user_search", {
    q: q ?? "",
    lim: 30,
  }); // memuat email (hanya server)
  const rows = (data ?? []) as {
    id: string;
    username: string;
    role: string;
    status: string;
    created_at: string;
    email: string;
  }[];
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title={tt("Pengguna")} tab="pengguna" />
      <Flash ok={ok} error={error} map={MAP} />
      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={tt("Cari username atau email")}
          className={`${ui.input} flex-1`}
        />
        <button className={ui.btn}>{tt("Cari")}</button>
      </form>
      <div className="space-y-2">
        {rows.map((p) => (
          <div
            key={p.id}
            className={`${ui.card} flex flex-wrap items-center gap-3`}
          >
            <span className="min-w-0 flex-1">
              <Link
                href={`/u/${p.username}`}
                className="font-medium hover:underline"
              >
                {p.username}
              </Link>
              {p.status === "banned" && (
                <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-[11px] text-white">
                  {tt("Diblokir")}
                </span>
              )}
              {p.role === "super_admin" && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px]">
                  {tt("Super admin")}
                </span>
              )}
              <span className="block truncate text-xs text-muted">
                {p.email}
              </span>
              <span className="block text-xs text-muted">
                {tt("Bergabung")}{" "}
                {new Date(p.created_at).toLocaleDateString(tt("id-ID"))}
              </span>
            </span>
            {p.role === "user" && p.id !== user.id && (
              <div className="flex gap-2">
                {p.status === "banned" ? (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="active" />
                    <button className={ui.ghost}>{tt("Buka blokir")}</button>
                  </form>
                ) : (
                  <ConfirmAction
                    action={setStatus}
                    fields={{ id: p.id, status: "banned" }}
                    label={tt("Blokir")}
                    title={tt("Blokir pengguna?")}
                    message="Pengguna ini akan dikeluarkan dan tidak bisa masuk sampai blokirnya dibuka."
                    confirm="Ya, blokir"
                    className={ui.ghost}
                  />
                )}
                <DeleteUserDialog
                  id={p.id}
                  username={p.username}
                  needsPassword={needsPassword}
                  en={tt.en}
                />
              </div>
            )}
          </div>
        ))}
        {!rows.length && (
          <p className="py-8 text-center text-sm text-muted">
            {tt("Tidak ditemukan.")}
          </p>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">
        {tt(
          "Akun terblokir otomatis dikeluarkan dan tidak bisa masuk. Hapus permanen menghapus semua thread dan komentar pengguna serta melepas keanggotaan komunitasnya, dan tidak dapat dibatalkan.",
        )}
      </p>
    </main>
  );
}
