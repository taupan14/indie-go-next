"use client";
import { useRef } from "react";

type Props = {
  action: (fd: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  title: string;
  message: string;
  confirm: string;
  cancel: string;
  close: string;
  danger: boolean;
  className?: string;
};

/** Tombol yang membuka dialog konfirmasi; aksi server baru dijalankan setelah pengguna menekan tombol konfirmasi. */
export default function ConfirmDialog({
  action,
  fields,
  label,
  title,
  message,
  confirm,
  cancel,
  close,
  danger,
  className,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={
          className ??
          "rounded-lg border border-danger px-2.5 py-1 text-xs text-danger"
        }
      >
        {label}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-0 text-left text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className={`font-medium ${danger ? "text-danger" : ""}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={close}
            className="text-xl leading-none text-muted"
          >
            ×
          </button>
        </div>
        <form action={action} className="space-y-4 p-4">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <p className="text-sm text-muted">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              {cancel}
            </button>
            <button
              className={`rounded-lg px-4 py-1.5 text-sm font-medium ${danger ? "bg-danger text-white" : "bg-primary text-primary-foreground"}`}
            >
              {confirm}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
