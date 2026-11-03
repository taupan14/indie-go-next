import Link from "next/link";
import { adminT } from "@/i18n/admin";

export const ui = {
  input:
    "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary",
  btn: "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground",
  ghost: "rounded-lg border border-border px-3 py-1.5 text-xs",
  card: "rounded-xl border border-border bg-surface p-3",
};

export async function Head({ title, tab }: { title: string; tab: string }) {
  const tt = await adminT();
  return (
    <>
      <Link href={`/admin?tab=${tab}`} className="text-xs text-muted">
        ← {tt("Panel admin")}
      </Link>
      <h1 className="mb-4 mt-1 text-xl font-medium">{tt(title)}</h1>
    </>
  );
}

export async function Flash({
  ok,
  error,
  map = {},
}: {
  ok?: string;
  error?: string;
  map?: Record<string, string>;
}) {
  const tt = await adminT();
  if (ok)
    return (
      <p
        role="status"
        className="mb-3 rounded-lg border border-border bg-accent px-3 py-2 text-sm"
      >
        {tt("Tersimpan.")}
      </p>
    );
  if (error)
    return (
      <p
        role="alert"
        className="mb-3 rounded-lg border border-danger bg-accent px-3 py-2 text-sm text-danger"
      >
        {tt(map[error] ?? "Isian tidak valid.")}
      </p>
    );
  return null;
}
