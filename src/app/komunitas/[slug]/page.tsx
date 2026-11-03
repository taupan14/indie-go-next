import Link from "next/link";
import { PAGE, buildHref, cleanQuery, pickSort, termsOf } from "@/lib/search";
import SearchResults, { Pager } from "@/components/SearchResults";
import SearchBox from "@/components/SearchBox";
import { safeUrl } from "@/lib/media";
import ConfirmAction from "@/components/ConfirmAction";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { CommunityBanner, CommunityLogo } from "@/components/CommunityArt";
import ThreadRows from "@/components/ThreadRows";
import MembersDialog from "@/components/MembersDialog";
import { toggleMembership } from "../actions";

const box = "rounded-xl border border-border bg-surface p-4";
const btn =
  "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground";

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; urut?: string; hal?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const { data: c } = await sb
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!c) notFound();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) {
    // diblokir: diperlakukan seperti belum bergabung, tanpa akses ke thread dan anggota (juga ditegakkan RLS)
    const { data: blocked } = await sb
      .from("community_blocks")
      .select("user_id")
      .eq("community_id", c.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (blocked)
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-lg font-medium">{c.name}</p>
          <p className="mt-2 text-sm text-muted">{t("community.blocked")}</p>
        </main>
      );
  }

  const q = cleanQuery(sp.q);
  const searching = q.length > 0;
  const urut = pickSort(sp.urut, searching);
  const page = Math.max(1, Number(sp.hal) || 1);
  const listRes = searching
    ? await sb.rpc("search_threads", {
        q,
        cat: null,
        comm: c.id,
        sort: urut,
        lim: PAGE,
        off: (page - 1) * PAGE,
      })
    : await sb
        .from("threads")
        .select(
          "id,title,upvote_count,comment_count,last_activity_at,categories(name,color)",
        )
        .eq("community_id", c.id)
        .eq("status", "published")
        .order(urut === "populer" ? "upvote_count" : "last_activity_at", {
          ascending: false,
        })
        .range((page - 1) * PAGE, page * PAGE - 1);
  const threads = (listRes.data ?? []) as any[];
  const total = searching ? Number(threads[0]?.total ?? 0) : 0;
  const hasNext = searching ? total > page * PAGE : threads.length === PAGE;
  const base = `/komunitas/${c.slug}`;
  const defSort = searching ? "relevan" : "terbaru";
  const href = (o: Record<string, string>) =>
    buildHref(base, { q, urut: urut === defSort ? "" : urut, ...o });
  const chip = (on: boolean) =>
    `inline-flex items-center rounded-full px-3 py-1 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-accent"}`;
  const sorts = searching
    ? ["relevan", "terbaru", "populer"]
    : ["terbaru", "populer"];
  const sortLabel: Record<string, string> = {
    relevan: t("search.relevance"),
    terbaru: t("thread.latest"),
    populer: t("thread.popular"),
  };

  // Daftar anggota hanya untuk pengguna login
  let members: { username: string; joined: string; avatar: string | null }[] =
    [];
  let isMember = false;
  const ids = [c.admin_id];
  if (user) {
    const { data: rows } = await sb
      .from("community_members")
      .select("user_id,joined_at")
      .eq("community_id", c.id)
      .order("joined_at")
      .limit(500);
    isMember = !!rows?.some((r: any) => r.user_id === user.id);
    ids.push(...(rows ?? []).map((r: any) => r.user_id));
    const { data: names } = await sb
      .from("author_public")
      .select("id,username,avatar_url")
      .in("id", [...new Set(ids)]);
    const fmt = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      month: "short",
      year: "numeric",
    });
    members = (rows ?? []).map((r: any) => {
      const n = names?.find((x: any) => x.id === r.user_id);
      return {
        username: n?.username ?? "?",
        joined: fmt.format(new Date(r.joined_at)),
        avatar: n?.avatar_url ? safeUrl(n.avatar_url) : null,
      };
    });
  }
  const { data: adm } = await sb
    .from("author_public")
    .select("username")
    .eq("id", c.admin_id)
    .maybeSingle();
  const isAdmin = user?.id === c.admin_id;
  const { data: me } = user
    ? await sb.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const canManage = isAdmin || me?.role === "super_admin";

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      <div className="overflow-hidden rounded-xl border border-border">
        <CommunityBanner c={c} className="h-28 md:h-36" />
      </div>

      <div className="my-4 flex flex-wrap items-center gap-3">
        <CommunityLogo c={c} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium">{c.name}</h1>
          <p className="text-xs text-muted">
            {c.member_count} {t("community.membersCount")} · {c.thread_count}{" "}
            {t("community.threads")}
          </p>
        </div>
        {!user ? (
          <Link href="/masuk" className={btn}>
            {t("community.join")}
          </Link>
        ) : isMember ? (
          <>
            <Link href={`/thread/new?c=${c.id}`} className={btn}>
              {t("nav.newThread")}
            </Link>
            {!isAdmin && (
              <ConfirmAction
                action={toggleMembership}
                fields={{ community_id: c.id, slug: c.slug }}
                label={t("community.leave")}
                title="Keluar dari komunitas?"
                message="Anda tidak lagi menjadi anggota dan tidak bisa membuat thread di sini. Anda bisa bergabung lagi kapan saja."
                confirm="Ya, keluar"
                danger={false}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
              />
            )}
          </>
        ) : (
          <form action={toggleMembership}>
            <input type="hidden" name="community_id" value={c.id} />
            <input type="hidden" name="slug" value={c.slug} />
            <button className={btn}>{t("community.join")}</button>
          </form>
        )}
      </div>
      {user && !isMember && (
        <p className="mb-3 text-xs text-muted">{t("community.joinToPost")}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section>
          <SearchBox
            action={base}
            q={q}
            placeholder={t("search.inCommunity")}
            button={t("search.button")}
            clearLabel={t("search.clear")}
            hidden={{ urut: sp.urut && sp.urut !== "relevan" ? sp.urut : "" }}
          />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {sorts.map((s) => (
              <Link
                key={s}
                href={href({ urut: s === defSort ? "" : s, hal: "" })}
                className={chip(urut === s)}
              >
                {sortLabel[s]}
              </Link>
            ))}
            {searching && (
              <span className="ml-auto text-xs text-muted">
                {t("search.results", { n: total, q })}
              </span>
            )}
          </div>
          {searching ? (
            <SearchResults
              rows={threads}
              terms={termsOf(q)}
              locale={locale}
              none={t("search.none", { q })}
              hint={t("search.hint")}
            />
          ) : (
            <ThreadRows
              threads={threads}
              locale={locale}
              l={{
                topic: t("home.topic"),
                votes: t("thread.votes"),
                replies: t("home.replies"),
                active: t("thread.active"),
                empty: t("community.noThreads"),
              }}
            />
          )}
          <Pager
            prev={
              page > 1
                ? href({ hal: page > 2 ? String(page - 1) : "" })
                : undefined
            }
            next={hasNext ? href({ hal: String(page + 1) }) : undefined}
            prevLabel={t("search.prev")}
            nextLabel={t("search.next")}
          />
        </section>
        <aside className="space-y-3 text-sm">
          {c.description && (
            <div className={box}>
              <p className="text-xs text-muted">{t("community.about")}</p>
              <p className="mt-1">{c.description}</p>
            </div>
          )}
          {c.announcement && (
            <div className={box}>
              <p className="text-xs text-muted">
                {t("community.announcement")}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{c.announcement}</p>
            </div>
          )}
          {c.rules && (
            <div className={box}>
              <p className="text-xs text-muted">{t("community.rules")}</p>
              <p className="mt-1 whitespace-pre-wrap">{c.rules}</p>
            </div>
          )}
          <div className={box}>
            <p className="text-xs text-muted">{t("community.admin")}</p>
            <p className="mt-1 font-medium">{adm?.username ?? "?"}</p>
            {canManage && (
              <Link
                href={`/komunitas/${c.slug}/kelola`}
                className="mt-2 inline-block text-xs font-medium text-primary"
              >
                Kelola komunitas
              </Link>
            )}
            <p className="mt-3 text-xs text-muted">{t("community.members")}</p>
            <p className="font-medium">{c.member_count}</p>
            {user ? (
              <MembersDialog
                label={t("community.viewMembers")}
                title={t("community.members")}
                close={t("community.close")}
                count={members.length}
                members={members}
              />
            ) : (
              <p className="mt-2 text-xs text-muted">
                {t("community.signInMembers")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
