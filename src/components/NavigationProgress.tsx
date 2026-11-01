"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_VISIBLE = 500; // ms: bar tampil minimal selama ini agar tetap terlihat di jaringan lokal yang cepat

/** Mengenali request navigasi (RSC, bukan prefetch) dan Server Action milik Next.js. */
function isTracked(input: RequestInfo | URL, init?: RequestInit) {
  const h = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  return (
    h.has("next-action") || (h.has("rsc") && !h.has("next-router-prefetch"))
  );
}

/** Bar progres neon di atas layar. Dipicu oleh: (1) klik tautan internal ke halaman lain, selesai saat path berubah;
 *  (2) request navigasi/Server Action yang sedang berjalan (komentar, upvote, simpan, dst). */
export default function NavigationProgress() {
  const path = usePathname();
  const [p, setP] = useState(0);
  const [on, setOn] = useState(false);
  const busy = useRef(false);
  const navPending = useRef(false);
  const pending = useRef(0);
  const shownAt = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval>>(undefined);
  const delay = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);
  const guard = useRef<ReturnType<typeof setTimeout>>(undefined);

  const begin = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    shownAt.current = Date.now();
    clearTimeout(hide.current);
    clearInterval(tick.current);
    setOn(true);
    setP(12);
    tick.current = setInterval(() => setP((v) => v + (90 - v) * 0.1), 200); // melambat mendekati 90%
  }, []);

  const finish = useCallback(() => {
    if (!busy.current) return;
    const wait = Math.max(0, MIN_VISIBLE - (Date.now() - shownAt.current));
    hide.current = setTimeout(() => {
      clearInterval(tick.current);
      setP(100);
      hide.current = setTimeout(() => {
        setOn(false);
        setP(0);
        busy.current = false;
      }, 350);
    }, wait);
  }, []);

  // (1) Klik tautan internal ke path lain: mulai seketika, selesai saat path berubah
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.(
        "a",
      ) as HTMLAnchorElement | null;
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download"))
        return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname === location.pathname)
        return; // path sama (mis. ganti ?urut=): ditangani pelacak request
      navPending.current = true;
      begin();
      clearTimeout(guard.current);
      guard.current = setTimeout(() => {
        navPending.current = false;
        finish();
      }, 8000); // pengaman bila navigasi batal
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [begin, finish]);

  useEffect(() => {
    if (navPending.current) {
      navPending.current = false;
      clearTimeout(guard.current);
      finish();
    }
  }, [path, finish]);

  // (2) Pelacak request navigasi dan Server Action
  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (input, init) => {
      const tracked = isTracked(input, init);
      if (tracked && pending.current++ === 0)
        delay.current = setTimeout(begin, 60);
      try {
        return await orig(input, init);
      } finally {
        if (tracked && --pending.current === 0) {
          clearTimeout(delay.current);
          if (!navPending.current) finish();
        }
      }
    };
    return () => {
      window.fetch = orig;
    };
  }, [begin, finish]);

  useEffect(
    () => () => {
      [delay, hide, guard].forEach((r) => clearTimeout(r.current));
      clearInterval(tick.current);
    },
    [],
  );

  // Neon: garis tipis solid + titik bulat bercahaya di ujung (warna mengikuti --primary)
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
      style={{ opacity: on ? 1 : 0, transition: "opacity 250ms" }}
    >
      <div
        className="relative h-full rounded-r-full bg-primary shadow-[0_0_6px_var(--primary),0_0_14px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
        style={{ width: `${p}%`, transition: "width 200ms ease-out" }}
      >
        <span className="absolute right-0 top-1/2 size-2.5 -translate-y-1/2">
          <span className="absolute -inset-1 animate-ping rounded-full bg-primary opacity-40 motion-reduce:animate-none" />
          <span className="absolute inset-0 rounded-full bg-primary shadow-[0_0_6px_2px_var(--primary),0_0_16px_4px_color-mix(in_srgb,var(--primary)_60%,transparent)]" />
          <span className="absolute inset-[3px] rounded-full bg-white/80" />
        </span>
      </div>
    </div>
  );
}
