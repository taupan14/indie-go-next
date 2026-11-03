"use client";
import { useRef, useState, useTransition } from "react";
import { reorderBanners } from "@/app/admin/banner/actions";
import { EN } from "@/i18n/admin-en";

/** Dialog detail: isinya (form server) diteruskan sebagai children. */
export function BannerDialog({
  trigger,
  title,
  children,
  closeLabel,
}: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  closeLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="block w-full text-left"
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-full max-w-lg rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-medium">{title}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={closeLabel}
            className="text-muted"
          >
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </dialog>
    </>
  );
}

export type OrderItem = {
  id: string;
  title: string;
  body: string;
  image: string | null;
  live: boolean;
};
type Zones = { strip: string[]; side: string[] };

/** Pratinjau Beranda mini: seret banner antar zona (strip atas / samping kanan) untuk mengatur posisi. */
export function BannerOrder({
  items,
  initial,
  en,
}: {
  items: OrderItem[];
  initial: Zones;
  en: boolean;
}) {
  const tr = (s: string) => (en ? (EN[s] ?? s) : s);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const [z, setZ] = useState<Zones>(initial);
  const [drag, setDrag] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const LIMIT = { strip: 3, side: 5 } as const;

  const put = (id: string, zone: keyof Zones, index?: number) => {
    const next: Zones = {
      strip: z.strip.filter((x) => x !== id),
      side: z.side.filter((x) => x !== id),
    };
    next[zone].splice(index ?? next[zone].length, 0, id);
    setZ(next);
    setDirty(true);
  };
  const shift = (zone: keyof Zones, i: number, d: number) => {
    if (i + d < 0 || i + d >= z[zone].length) return;
    put(z[zone][i], zone, i + d);
  };

  const Zone = ({ zone, label }: { zone: keyof Zones; label: string }) => {
    let shown = 0;
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => drag && put(drag, zone)}
        className="min-h-14 space-y-1.5 rounded-lg border border-dashed border-border bg-background p-2"
      >
        <p className="text-[11px] font-medium text-muted">{label}</p>
        {z[zone].map((id, i) => {
          const b = byId[id];
          const visible = b.live && shown++ < LIMIT[zone];
          return (
            <div
              key={id}
              draggable
              onDragStart={() => setDrag(id)}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation();
                if (drag && drag !== id) put(drag, zone, i);
              }}
              className={`flex cursor-grab items-center gap-2 rounded-lg border border-border bg-surface p-1.5 text-xs active:cursor-grabbing ${drag === id ? "opacity-40" : ""} ${b.live ? "" : "opacity-60"}`}
            >
              <span aria-hidden className="text-muted">
                ⋮⋮
              </span>
              {b.image ? (
                <img
                  src={b.image}
                  alt=""
                  className="h-8 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{b.title}</span>
                  <span className="block truncate text-muted">{b.body}</span>
                </span>
              )}
              {b.image && (
                <span className="min-w-0 flex-1 truncate font-medium">
                  {b.title}
                </span>
              )}
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${visible ? "bg-primary text-primary-foreground" : "bg-accent text-muted"}`}
              >
                {visible
                  ? tr("Tampil")
                  : b.live
                    ? tr("Antrean")
                    : tr("Tidak aktif")}
              </span>
              <span className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label={tr("Naik")}
                  onClick={() => shift(zone, i, -1)}
                  className="leading-none text-muted"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={tr("Turun")}
                  onClick={() => shift(zone, i, 1)}
                  className="leading-none text-muted"
                >
                  ▼
                </button>
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="space-y-2">
        <Zone
          zone="strip"
          label={tr("Strip pengumuman (atas Beranda, 3 tampil)")}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-lg bg-accent/50 p-3" aria-hidden>
            {[90, 70, 80, 60].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded bg-border"
                style={{ width: `${w}%` }}
              />
            ))}
            <p className="pt-1 text-[11px] text-muted">{tr("Daftar topik")}</p>
          </div>
          <Zone zone="side" label={tr("Banner samping (kanan, 5 tampil)")} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {dirty && (
          <span className="text-xs text-muted">{tr("Belum disimpan")}</span>
        )}
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              await reorderBanners(z);
              setDirty(false);
            })
          }
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? tr("Menyimpan...") : tr("Simpan posisi")}
        </button>
      </div>
    </div>
  );
}
