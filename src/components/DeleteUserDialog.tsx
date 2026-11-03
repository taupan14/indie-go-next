"use client";
import { useRef } from "react";
import { deleteUser } from "@/app/admin/pengguna/actions";
import { EN } from "@/i18n/admin-en";

/** Dialog hapus permanen: wajib memasukkan kata sandi super admin (atau mengetik username bila masuk lewat Google). */
export default function DeleteUserDialog({
  id,
  username,
  needsPassword,
  en,
}: {
  id: string;
  username: string;
  needsPassword: boolean;
  en: boolean;
}) {
  const tr = (s: string) => (en ? (EN[s] ?? s) : s);
  const ref = useRef<HTMLDialogElement>(null);
  const input =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-danger";
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="rounded-lg border border-danger px-3 py-1.5 text-xs font-medium text-danger"
      >
        {tr("Hapus")}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-medium text-danger">
            {tr("Hapus permanen")}: {username}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={tr("Tutup")}
            className="text-xl leading-none text-muted"
          >
            ×
          </button>
        </div>
        <form action={deleteUser} className="space-y-3 p-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm">
            {tr(
              "Semua thread dan komentar pengguna ini akan dihapus, keanggotaan komunitasnya dilepas, dan akunnya dihapus. Tindakan ini tidak dapat dibatalkan.",
            )}
          </p>
          {needsPassword ? (
            <label className="block text-xs text-muted">
              {tr("Masukkan kata sandi Anda untuk memverifikasi")}
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={`${input} mt-1 text-foreground`}
              />
            </label>
          ) : (
            <label className="block text-xs text-muted">
              {tr(
                "Akun Anda masuk lewat Google. Ketik username pengguna ini untuk mengonfirmasi:",
              )}{" "}
              <b>{username}</b>
              <input
                name="confirm"
                required
                autoComplete="off"
                className={`${input} mt-1 text-foreground`}
              />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              {tr("Batal")}
            </button>
            <button className="rounded-lg bg-danger px-4 py-1.5 text-sm font-medium text-white">
              {tr("Hapus permanen")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
