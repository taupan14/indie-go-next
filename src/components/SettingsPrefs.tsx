"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { setLocale } from "@/app/actions";

type L = { language: string; theme: string; light: string; dark: string; system: string; perDevice: string };

export default function SettingsPrefs({ locale, labels }: { locale: "id" | "en"; labels: L }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const seg = (on: boolean) => `px-3 py-1.5 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-surface"}`;
  const wrap = "inline-flex overflow-hidden rounded-lg border border-border";
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm font-medium">{labels.language}</p>
        <div className={wrap}>
          {(["id", "en"] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLocale(l)} className={seg(l === locale)}>{l === "id" ? "Indonesia" : "English"}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">{labels.theme}</p>
        <div className={wrap}>
          {(["light", "dark", "system"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTheme(k)} className={seg(mounted && theme === k)}>{labels[k]}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">{labels.perDevice}</p>
    </div>
  );
}
