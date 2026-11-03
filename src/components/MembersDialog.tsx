"use client";
import { useRef } from "react";
import { tint, initials } from "@/lib/community";

export default function MembersDialog({
  label,
  title,
  close,
  count,
  members,
}: {
  label: string;
  title: string;
  close: string;
  count: number;
  members: { username: string; joined: string; avatar: string | null }[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        onClick={() => ref.current?.showModal()}
        className="mt-2 text-xs font-medium text-primary"
      >
        {label} ({count})
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-full max-w-sm rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-medium">{title}</h2>
          <button
            onClick={() => ref.current?.close()}
            aria-label={close}
            className="text-muted"
          >
            ×
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2 text-sm">
          {members.map((m) => (
            <li
              key={m.username}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              {m.avatar ? (
                <>
                  <img
                    src={m.avatar}
                    alt={m.username}
                    loading="lazy"
                    className="size-7 shrink-0 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate">{m.username}</span>
                </>
              ) : (
                <>
                  <span
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-[#2B1B17]"
                    style={{ background: tint(m.username) }}
                  >
                    {initials(m.username)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{m.username}</span>
                </>
              )}
              <span className="shrink-0 text-xs text-muted">{m.joined}</span>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
