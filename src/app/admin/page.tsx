import Link from "next/link";
import { adminT } from "@/i18n/admin";
import { requireSuperAdmin } from "@/lib/admin";

const TABS = [
  ["ringkasan", "Ringkasan"],
  ["moderasi", "Moderasi"],
  ["konten", "Konten"],
  ["pengguna", "Pengguna"],
  ["sistem", "Sistem"],
] as const;
// href null = dikerjakan di tahap B
const MODULES = [
  {
    tab: "moderasi",
    title: "Laporan",
    desc: "Tinjau konten yang dilaporkan",
    href: "/admin/laporan",
  },
  {
    tab: "konten",
    title: "Komunitas",
    desc: "Buat komunitas dan undang admin",
    href: "/admin/komunitas",
  },
  {
    tab: "konten",
    title: "Kategori",
    desc: "Kelola kategori diskusi",
    href: "/admin/kategori",
  },
  {
    tab: "konten",
    title: "Banner",
    desc: "Strip dan banner samping",
    href: "/admin/banner",
  },
  {
    tab: "konten",
    title: "Filter konten",
    desc: "Kata dan domain terlarang",
    href: "/admin/filter",
  },
  {
    tab: "pengguna",
    title: "Pengguna",
    desc: "Blokir, buka blokir, atau hapus akun",
    href: "/admin/pengguna",
  },
  {
    tab: "sistem",
    title: "Dukungan (QRIS)",
    desc: "Gambar QRIS dan tautan Saweria di footer",
    href: "/admin/dukungan",
  },
  {
    tab: "sistem",
    title: "Email",
    desc: "Templat, pengirim, dan tata letak email",
    href: "/admin/email",
  },
  {
    tab: "sistem",
    title: "Feedback",
    desc: "Masukan dari pengguna dan tamu",
    href: "/admin/feedback",
  },
  {
    tab: "sistem",
    title: "Popularitas",
    desc: "Bobot poin dan ambang level",
    href: "/admin/popularitas",
  },
  {
    tab: "sistem",
    title: "Audit log",
    desc: "Riwayat tindakan admin",
    href: "/admin/audit",
  },
];

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tt = await adminT();
  const { sb } = await requireSuperAdmin();
  const { tab } = await searchParams;
  const active = TABS.find(([k]) => k === tab)?.[0] ?? "ringkasan";
  const count = async (table: string, f?: [string, string]) => {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    if (f) q = q.eq(f[0], f[1]);
    return (await q).count ?? 0;
  };
  const [users, threads, communities, reports] = await Promise.all([
    count("profiles"),
    count("threads"),
    count("communities"),
    count("reports", ["status", "open"]),
  ]);
  const cards =
    active === "ringkasan"
      ? MODULES.filter((m) => m.href)
      : MODULES.filter((m) => m.tab === active);

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      <h1 className="mb-3 text-xl font-medium">{tt("Panel admin")}</h1>
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            href={`/admin?tab=${k}`}
            className={`border-b-2 px-3 py-2 text-sm ${k === active ? "border-primary font-medium" : "border-transparent text-muted"}`}
          >
            {tt(label)}
          </Link>
        ))}
      </div>
      {active === "ringkasan" && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [tt("Pengguna"), users],
            [tt("Total thread"), threads],
            [tt("Komunitas"), communities],
            [tt("Laporan terbuka"), reports],
          ].map(([l, n]) => (
            <div key={l as string} className="rounded-xl bg-accent p-3">
              <p className="text-xl font-medium">{n}</p>
              <p className="text-xs text-muted">{l}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((m) => (
          <div
            key={m.title}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="font-medium">
              {tt(m.title)}{" "}
              {m.title === "Laporan" && reports > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {reports}
                </span>
              )}
            </p>
            <p className="mb-3 mt-1 text-xs text-muted">{tt(m.desc)}</p>
            {m.href ? (
              <Link
                href={m.href}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                {tt("Buka")}
              </Link>
            ) : (
              <span className="text-xs text-muted">{tt("Segera hadir")}</span>
            )}
          </div>
        ))}
        {!cards.length && (
          <p className="text-sm text-muted">{tt("Belum ada modul.")}</p>
        )}
      </div>
    </main>
  );
}
