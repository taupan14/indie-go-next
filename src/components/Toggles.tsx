"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { setLocale } from "@/app/actions";

export function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      aria-label={label}
      title={label}
      className="rounded-md px-2 py-1 text-muted hover:bg-accent"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      ◐
    </button>
  );
}

export function LocaleToggle({ current }: { current: "id" | "en" }) {
  return (
    <span className="flex gap-1 text-xs" aria-label="Language">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded px-1.5 py-0.5 uppercase ${l === current ? "bg-accent font-medium text-foreground" : "text-muted"}`}
        >
          {l}
        </button>
      ))}
    </span>
  );
}

export function BannerStrip({
  text,
  body,
  href,
  image,
  dismiss,
}: {
  text: string;
  body?: string | null;
  href?: string | null;
  image?: string | null;
  dismiss: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  if (image) {
    const img = (
      <img src={image} alt={text} className="max-h-28 w-full object-cover" />
    );
    return (
      <div className="relative mb-3 overflow-hidden rounded-lg border border-border">
        {href ? <a href={href}>{img}</a> : img}
        <button
          aria-label={dismiss}
          onClick={() => setOpen(false)}
          className="absolute right-2 top-2 rounded-full bg-black/50 px-2 text-sm text-white"
        >
          ×
        </button>
      </div>
    );
  }
  return (
    <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-accent px-3 py-2 text-sm">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{text}</span>
        {body && <span className="block text-xs text-muted">{body}</span>}
      </span>
      {href && (
        <a href={href} className="shrink-0 font-medium text-primary">
          Lihat
        </a>
      )}
      <button
        aria-label={dismiss}
        onClick={() => setOpen(false)}
        className="shrink-0 text-muted"
      >
        ×
      </button>
    </div>
  );
}
