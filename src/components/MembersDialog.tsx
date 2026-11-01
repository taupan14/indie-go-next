"use client";
import { useRef } from "react";

export default function MembersDialog({ label, title, close, count, members }:
  { label: string; title: string; close: string; count: number; members: { username: string; joined: string }[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button onClick={() => ref.current?.showModal()} className="mt-2 text-xs font-medium text-primary">{label} ({count})</button>
      <dialog ref={ref} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-auto w-full max-w-sm rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-medium">{title}</h2>
          <button onClick={() => ref.current?.close()} aria-label={close} className="text-muted">×</button>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2 text-sm">
          {members.map((m) => (
            <li key={m.username} className="flex justify-between rounded-md px-2 py-1.5 hover:bg-accent">
              <span>{m.username}</span><span className="text-xs text-muted">{m.joined}</span>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
