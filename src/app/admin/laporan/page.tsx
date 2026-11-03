import Link from "next/link";
import { adminT } from "@/i18n/admin";
import ConfirmAction from "@/components/ConfirmAction";
import { requireSuperAdmin } from "@/lib/admin";
import { resolveReport } from "./actions";

const REASON: Record<string, string> = {
  porn: "Pornografi",
  drugs: "Narkoba",
  gambling: "Judi",
  trafficking: "Perdagangan manusia",
  violence: "Kekerasan",
  swearing: "Kata kasar",
  racism: "Rasis/SARA",
  other: "Lainnya",
};

export default async function Laporan() {
  const tt = await adminT();
  const { sb } = await requireSuperAdmin();
  const { data: rows } = await sb
    .from("reports")
    .select(
      "id,reason,thread_id,comment_id,threads(id,title,body,status,author_id),comments(id,body,thread_id,status,author_id)",
    )
    .eq("status", "open")
    .order("created_at");

  // Kelompokkan per konten yang dilaporkan
  const groups = new Map<
    string,
    {
      kind: "thread" | "comment";
      id: string;
      item: any;
      reasons: Record<string, number>;
      n: number;
    }
  >();
  for (const r of (rows ?? []) as any[]) {
    const kind = r.thread_id ? "thread" : "comment";
    const id = r.thread_id ?? r.comment_id;
    const item = kind === "thread" ? r.threads : r.comments;
    if (!item) continue;
    const g = groups.get(id) ?? {
      kind,
      id,
      item,
      reasons: {} as Record<string, number>, // Tambahkan 'as Record<string, number>'
      n: 0,
    };
    g.reasons[r.reason] = (g.reasons[r.reason] ?? 0) + 1;
    g.n++;
    groups.set(id, g);
  }
  const list = [...groups.values()].sort((a, b) => b.n - a.n);
  const authorIds = [
    ...new Set(list.map((g) => g.item.author_id).filter(Boolean)),
  ];
  const { data: authors } = await sb
    .from("author_public")
    .select("id,username")
    .in("id", authorIds);
  const who = (id: string | null) =>
    authors?.find((a: any) => a.id === id)?.username ?? tt("Akun dihapus");

  const Btn = ({
    mode,
    g,
    label,
    danger,
  }: {
    mode: string;
    g: (typeof list)[number];
    label: string;
    danger?: boolean;
  }) => (
    <form action={resolveReport}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="kind" value={g.kind} />
      <input type="hidden" name="id" value={g.id} />
      <input type="hidden" name="author" value={g.item.author_id ?? ""} />
      <button
        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${danger ? "bg-primary text-primary-foreground" : "border border-border"}`}
      >
        {label}
      </button>
    </form>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/admin?tab=moderasi" className="text-xs text-muted">
        {tt("← Panel admin")}
      </Link>
      <h1 className="mb-1 mt-1 text-xl font-medium">
        {tt("Laporan (")}
        {list.length})
      </h1>
      <p className="mb-4 text-xs text-muted">
        {tt(
          "Konten dengan 3 pelapor berbeda disembunyikan otomatis dan tetap muncul di sini agar bisa dipulihkan.",
        )}
      </p>
      <div className="space-y-3">
        {list.map((g) => {
          const hidden = g.item.status === "hidden";
          const href = `/thread/${g.kind === "thread" ? g.id : g.item.thread_id}`;
          return (
            <div
              key={g.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="text-xs text-muted">
                {g.kind === "thread" ? tt("Thread") : tt("Komentar")}{" "}
                {tt("· oleh")} {who(g.item.author_id)} · {g.n} {tt("laporan")}{" "}
                {hidden && (
                  <span className="ml-1 rounded-full bg-accent px-2 py-0.5">
                    {tt("disembunyikan")}
                  </span>
                )}
              </p>
              <Link
                href={href}
                className="mt-1 block font-medium hover:underline"
              >
                {g.kind === "thread" ? g.item.title : g.item.body.slice(0, 120)}
              </Link>
              {g.kind === "thread" && (
                <p className="mt-1 line-clamp-3 break-words text-sm text-muted">
                  {g.item.body}
                </p>
              )}
              <p className="mt-2 text-xs">
                {Object.entries(g.reasons)
                  .map(([k, v]) => `${tt(REASON[k] ?? k)} (${v})`)
                  .join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {hidden ? (
                  <>
                    <Btn mode="restore" g={g} label={tt("Pulihkan")} />
                    <Btn
                      mode="keep"
                      g={g}
                      label={tt("Tetap sembunyikan")}
                      danger
                    />
                  </>
                ) : (
                  <>
                    <Btn mode="hide" g={g} label={tt("Sembunyikan")} danger />
                    <Btn mode="dismiss" g={g} label={tt("Abaikan laporan")} />
                    {g.item.author_id && (
                      <ConfirmAction
                        action={resolveReport}
                        fields={{
                          mode: "suspend",
                          kind: g.kind,
                          id: g.id,
                          author: g.item.author_id,
                        }}
                        label={tt("Sembunyikan + blokir penulis")}
                        title={tt("Sembunyikan konten dan blokir penulis?")}
                        message="Konten ini disembunyikan dan akun penulisnya diblokir sampai admin membuka blokirnya."
                        confirm="Ya, blokir"
                        className="rounded-lg border border-danger px-3 py-1.5 text-xs text-danger"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {!list.length && (
          <p className="py-10 text-center text-sm text-muted">
            {tt("Tidak ada laporan terbuka.")}
          </p>
        )}
      </div>
    </main>
  );
}
