import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { ago } from "@/lib/time";
import { levelOf, levelsFrom } from "@/lib/popularity";
import { tint, initials } from "@/lib/community";
import { safeUrl } from "@/lib/media";
import { CommunityLogo } from "@/components/CommunityArt";
import ThreadRows from "@/components/ThreadRows";

type P = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProfilePage({ params, searchParams }: P) {
  const { username } = await params;
  const { tab } = await searchParams;
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser(); // halaman dijaga middleware: tamu tidak bisa masuk

  const { data: p } = await sb
    .from("profiles")
    .select("id,username,avatar_url,bio,created_at,hide_communities")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!p) notFound();
  const own = user?.id === p.id;
  const active =
    tab === "komentar"
      ? "komentar"
      : tab === "tersimpan" && own
        ? "tersimpan"
        : "thread";

  const [pts, tc, cc, mem] = await Promise.all([
    sb.rpc("popularity_of", { uid: p.id }),
    sb
      .from("threads")
      .select("id", { count: "exact", head: true })
      .eq("author_id", p.id)
      .eq("status", "published"),
    sb
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", p.id)
      .eq("status", "published"),
    sb
      .from("community_members")
      .select(
        "joined_at,communities(slug,name,logo_url,banner_url,member_count)",
      )
      .eq("user_id", p.id)
      .order("joined_at"),
  ]);
  const points = Number(pts.data ?? 0);
  const { data: ps } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "popularity")
    .maybeSingle();
  const lv = levelOf(points, levelsFrom(ps?.value));

  const { data: threads } =
    active === "thread"
      ? await sb
          .from("threads")
          .select(
            "id,title,upvote_count,comment_count,last_activity_at,categories(name,color)",
          )
          .eq("author_id", p.id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(30)
      : { data: [] as any[] };
  const { data: comments } =
    active === "komentar"
      ? await sb
          .from("comments")
          .select("id,body,created_at,thread_id,threads(title)")
          .eq("author_id", p.id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(30)
      : { data: [] as any[] };

  const date = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", o).format(
      new Date(iso),
    );
  const avatar = p.avatar_url ? safeUrl(p.avatar_url) : null;
  const tabCls = (on: boolean) =>
    `border-b-2 px-3 py-2 text-sm ${on ? "border-primary font-medium" : "border-transparent text-muted"}`;
  const box = "rounded-xl border border-border bg-surface";

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <div className="flex flex-wrap items-center gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="inline-flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-medium text-[#2B1B17]"
            style={{ background: tint(p.username) }}
          >
            {initials(p.username)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-lg font-medium">
            {p.username}
            <span className="rounded-full border border-primary px-2 py-0.5 text-xs font-normal text-primary">
              {t("profile.level_" + lv.key)}
            </span>
          </h1>
          <p className="text-xs text-muted">
            {t("profile.joined")}{" "}
            {date(p.created_at, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {tc.count ?? 0} {t("profile.threads").toLowerCase()} ·{" "}
            {cc.count ?? 0} {t("profile.comments").toLowerCase()}
          </p>
        </div>
        {own && (
          <Link
            href="/settings"
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            {t("profile.editProfile")}
          </Link>
        )}
      </div>
      {p.bio && <p className="mt-3 text-sm">{p.bio}</p>}

      {/* Meter popularitas: hanya angka, misal 214 [bar] 300 */}
      <div
        className="my-4 flex items-center gap-3 text-xs text-muted"
        aria-label={t("profile.level_" + lv.key)}
      >
        <span className="font-medium text-foreground">{points}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.round(lv.fraction * 100)}%` }}
          />
        </div>
        {lv.next && <span>{lv.next}</span>}
      </div>

      {(own || !p.hide_communities) && (
        <>
          <h2 className="mb-2 text-sm font-medium">
            {t("profile.communities")} ({mem.data?.length ?? 0})
          </h2>
          <div className="mb-5 space-y-2">
            {(mem.data ?? []).map(
              (r: any) =>
                r.communities && (
                  <Link
                    key={r.communities.slug}
                    href={`/komunitas/${r.communities.slug}`}
                    className={`${box} flex items-center gap-3 p-3 hover:bg-accent`}
                  >
                    <CommunityLogo c={r.communities} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {r.communities.name}
                      </span>
                      <span className="text-xs text-muted">
                        {r.communities.member_count}{" "}
                        {t("community.membersCount")} ·{" "}
                        {t("profile.joined").toLowerCase()}{" "}
                        {date(r.joined_at, { month: "short", year: "numeric" })}
                      </span>
                    </span>
                  </Link>
                ),
            )}
            {!mem.data?.length && (
              <p className="text-sm text-muted">{t("profile.noCommunities")}</p>
            )}
          </div>
        </>
      )}

      <div className="mb-3 flex border-b border-border">
        <Link href={`/u/${p.username}`} className={tabCls(active === "thread")}>
          {t("profile.threads")}
        </Link>
        <Link
          href={`/u/${p.username}?tab=komentar`}
          className={tabCls(active === "komentar")}
        >
          {t("profile.comments")}
        </Link>
        {own && (
          <Link
            href={`/u/${p.username}?tab=tersimpan`}
            className={tabCls(active === "tersimpan")}
          >
            {t("profile.saved")}{" "}
            <span className="text-xs text-muted">· {t("profile.private")}</span>
          </Link>
        )}
      </div>

      {active === "thread" && (
        <ThreadRows
          threads={threads ?? []}
          locale={locale}
          l={{
            topic: t("home.topic"),
            votes: t("thread.votes"),
            replies: t("home.replies"),
            active: t("thread.active"),
            empty: t("profile.noThreads"),
          }}
        />
      )}
      {active === "komentar" && (
        <div>
          {(comments ?? []).map((c: any) => (
            <Link
              key={c.id}
              href={`/thread/${c.thread_id}`}
              className="block border-b border-border px-1 py-3 text-sm hover:bg-accent"
            >
              <span className="line-clamp-2 break-words">{c.body}</span>
              <span className="mt-1 block text-xs text-muted">
                {t("profile.onThread")} {c.threads?.title} ·{" "}
                {ago(c.created_at, locale)}
              </span>
            </Link>
          ))}
          {!comments?.length && (
            <p className="py-10 text-center text-sm text-muted">
              {t("profile.noComments")}
            </p>
          )}
        </div>
      )}
      {active === "tersimpan" && (
        <p className="py-10 text-center text-sm text-muted">
          {t("profile.soon")}
        </p>
      )}
    </main>
  );
}
