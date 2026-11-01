import Link from "next/link";

export const ui = {
  input: "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary",
  btn: "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground",
  ghost: "rounded-lg border border-border px-3 py-1.5 text-xs",
  card: "rounded-xl border border-border bg-surface p-3",
};

export function Head({ title, tab }: { title: string; tab: string }) {
  return (<><Link href={`/admin?tab=${tab}`} className="text-xs text-muted">← Panel admin</Link><h1 className="mb-4 mt-1 text-xl font-medium">{title}</h1></>);
}

export function Flash({ ok, error, map = {} }: { ok?: string; error?: string; map?: Record<string, string> }) {
  if (ok) return <p role="status" className="mb-3 rounded-lg border border-border bg-accent px-3 py-2 text-sm">Tersimpan.</p>;
  if (error) return <p role="alert" className="mb-3 rounded-lg border border-danger bg-accent px-3 py-2 text-sm text-danger">{map[error] ?? "Isian tidak valid."}</p>;
  return null;
}
