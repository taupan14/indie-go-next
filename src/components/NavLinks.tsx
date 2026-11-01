"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

type Item = { href: string; label: string };

/** Menu dengan indikator aktif yang meluncur: latar pil + garis bawah mengikuti halaman aktif. */
export default function NavLinks({ items }: { items: Item[] }) {
  const path = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false); // tanpa animasi pada pengukuran pertama

  const activeHref = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) =>
      i.href === "/"
        ? path === "/"
        : path === i.href || path.startsWith(i.href + "/"),
    )?.href;

  useLayoutEffect(() => {
    const measure = () => {
      const el = box.current?.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      setBar(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    const r = requestAnimationFrame(() => setReady(true));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("resize", measure);
    };
  }, [path, items.length]);

  const move = `transform ${ready ? "320ms" : "0ms"} cubic-bezier(.22,1,.36,1), width ${ready ? "320ms" : "0ms"} cubic-bezier(.22,1,.36,1), opacity 200ms`;
  return (
    <div ref={box} className="relative flex gap-1">
      {items.map((i) => {
        const on = i.href === activeHref;
        return (
          <Link
            key={i.href}
            href={i.href}
            data-active={on}
            aria-current={on ? "page" : undefined}
            className={`relative z-10 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${on ? "font-medium text-primary" : "text-muted hover:text-foreground"}`}
          >
            {i.label}
          </Link>
        );
      })}
      <span
        aria-hidden
        className="absolute top-1/2 left-0 h-8 rounded-md bg-accent motion-reduce:!transition-none"
        style={{
          width: bar?.w ?? 0,
          transform: `translate(${bar?.x ?? 0}px, -50%)`,
          opacity: bar ? 1 : 0,
          transition: move,
        }}
      />
      <span
        aria-hidden
        className="absolute left-0 h-0.5 rounded-full bg-primary motion-reduce:!transition-none"
        style={{
          bottom: -11,
          width: bar ? Math.max(bar.w - 16, 0) : 0,
          transform: `translateX(${(bar?.x ?? 0) + 8}px)`,
          opacity: bar ? 1 : 0,
          transition: move,
        }}
      />
    </div>
  );
}
