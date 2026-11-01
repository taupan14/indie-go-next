"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { LocaleToggle, ThemeToggle } from "./Toggles";

type Props = {
  items: { href: string; label: string }[];
  signedIn: boolean;
  locale: "id" | "en";
  labels: {
    menu: string;
    close: string;
    settings: string;
    signOut: string;
    signIn: string;
    signUp: string;
    theme: string;
  };
};

/** Menu mobile: tombol hamburger yang berubah jadi X, panel turun dari header, backdrop, tutup otomatis saat pindah halaman. */
export default function MobileMenu({ items, signedIn, locale, labels }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (h: string) =>
    h === "/" ? path === "/" : path === h || path.startsWith(h + "/");
  const row = "flex min-h-11 items-center rounded-lg px-3 text-sm";
  const bar =
    "absolute left-2.5 h-0.5 w-5 rounded bg-current transition-all duration-300 motion-reduce:transition-none";

  return (
    <>
      <button
        type="button"
        aria-label={open ? labels.close : labels.menu}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        className="relative size-10 shrink-0 rounded-lg hover:bg-accent"
      >
        <span
          className={bar}
          style={{
            top: 14,
            transform: open ? "translateY(6px) rotate(45deg)" : "none",
          }}
        />
        <span className={bar} style={{ top: 20, opacity: open ? 0 : 1 }} />
        <span
          className={bar}
          style={{
            top: 26,
            transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="absolute inset-x-0 top-full h-screen bg-black/40"
        />
      )}
      <div
        id="mobile-menu"
        inert={!open}
        className={`absolute inset-x-0 top-full border-b border-border bg-surface px-3 pb-4 pt-2 shadow-lg transition-all duration-300 motion-reduce:transition-none ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}
      >
        <nav className="space-y-1" aria-label={labels.menu}>
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active(i.href) ? "page" : undefined}
              className={`${row} ${active(i.href) ? "bg-accent font-medium text-primary" : "text-foreground hover:bg-accent"}`}
            >
              {i.label}
            </Link>
          ))}
          {signedIn && (
            <Link
              href="/settings"
              className={`${row} ${active("/settings") ? "bg-accent font-medium text-primary" : "hover:bg-accent"}`}
            >
              {labels.settings}
            </Link>
          )}
        </nav>

        <div className="my-3 flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <LocaleToggle current={locale} />
          <ThemeToggle label={labels.theme} />
        </div>

        {signedIn ? (
          <form action={signOut}>
            <button className={`${row} w-full border border-border text-muted`}>
              {labels.signOut}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/masuk"
              className={`${row} justify-center bg-primary font-medium text-primary-foreground`}
            >
              {labels.signIn}
            </Link>
            <Link
              href="/masuk?mode=daftar"
              className={`${row} justify-center border border-border`}
            >
              {labels.signUp}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
