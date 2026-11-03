import Link from "next/link";
import { cleanQuery } from "@/lib/search";
import SearchBox from "@/components/SearchBox";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { CommunityBanner, CommunityLogo } from "@/components/CommunityArt";
import { toggleMembership } from "./actions";

const NIL = "00000000-0000-0000-0000-000000000000";
const FILTERS = ["semua", "diikuti", "populer", "terbaru"] as const;

export default async function Komunitas({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  const { f, q: qParam } = await searchParams;
  const needle = cleanQuery(qParam);
  const term = needle.replace(/[,()%_\\]/g, " ").trim(); // karakter yang mengganggu sintaks filter dibuang
  const filter = FILTERS.find((x) => x === f) ?? "semua";
  const t = makeT(await getLocale());
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let mine: string[] = [];
  if (user) {
    const { data } = await sb
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    mine = (data ?? []).map((r: any) => r.community_id);
  }
  let q = sb
    .from("communities")
    .select("id,slug,name,logo_url,banner_url,member_count,thread_count");
  if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  if (filter === "diikuti") q = q.in("id", mine.length ? mine : [NIL]);
  q =
    filter === "terbaru"
      ? q.order("created_at", { ascending: false })
      : filter === "semua"
        ? q.order("name")
        : q.order("member_count", { ascending: false });
  const { data: list } = await q;

  const label = {
    semua: t("community.all"),
    diikuti: t("community.mine"),
    populer: t("community.popular"),
    terbaru: t("community.newest"),
  };
  const chip = (on: boolean) =>
    `rounded-md px-3 py-1 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-accent"}`;
  const btn =
    "rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground";

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      <h1 className="mb-3 text-xl font-medium">{t("nav.communities")}</h1>
      <SearchBox
        action="/komunitas"
        q={needle}
        placeholder={t("search.communities")}
        button={t("search.button")}
        clearLabel={t("search.clear")}
        hidden={{ f: f ?? "" }}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.filter((x) => x !== "diikuti" || user).map((x) => (
          <Link
            key={x}
            href={`/komunitas${x === "semua" && !needle ? "" : "?"}${[x === "semua" ? "" : `f=${x}`, needle ? `q=${encodeURIComponent(needle)}` : ""].filter(Boolean).join("&")}`}
            className={chip(x === filter)}
          >
            {label[x]}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(list ?? []).map((c: any) => (
          <div
            key={c.id}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <Link href={`/komunitas/${c.slug}`} className="block">
              <CommunityBanner c={c} className="h-14" />
              <div className="p-3">
                <div className="-mt-9 mb-2 w-fit rounded-xl border-2 border-surface">
                  <CommunityLogo c={c} size={40} />
                </div>
                <p className="font-medium">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {c.member_count} {t("community.membersCount")} ·{" "}
                  {c.thread_count} {t("community.threads")}
                </p>
              </div>
            </Link>
            <div className="px-3 pb-3">
              {!user ? (
                <Link href="/masuk" className={`${btn} inline-block`}>
                  {t("community.join")}
                </Link>
              ) : mine.includes(c.id) ? (
                <span className="inline-block rounded-lg border border-primary px-3 py-1 text-xs font-medium text-primary">
                  {t("community.member")}
                </span>
              ) : (
                <form action={toggleMembership}>
                  <input type="hidden" name="community_id" value={c.id} />
                  <input type="hidden" name="slug" value={c.slug} />
                  <button className={btn}>{t("community.join")}</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
      {!list?.length && (
        <p className="py-10 text-center text-sm text-muted">
          {needle
            ? t("search.noCommunity", { q: needle })
            : t("community.empty")}
        </p>
      )}
    </main>
  );
}
